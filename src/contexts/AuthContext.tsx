import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getVisitorFingerprint } from '@/lib/fingerprint'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: 'admin' | 'user' | 'viewer' | null
  companyId: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, country?: string, currency?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'viewer' | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const fetchUserData = async (userId: string): Promise<void> => {
    try {
      // Use a shorter timeout and better error handling
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )

      const queryPromise = supabase
        .from('users')
        .select('role, company_id')
        .eq('id', userId)
        .single()
        .then((result) => {
          if (result.error) throw result.error
          return result
        })

      let result
      try {
        result = await Promise.race([queryPromise, timeoutPromise])
      } catch (timeoutError: any) {
        if (timeoutError.message === 'Request timeout') {
          console.warn('User data fetch timed out, continuing without role/company')
          // Don't throw - allow app to continue
          return
        }
        throw timeoutError
      }
      
      const { data, error } = result

      if (error) {
        // If user record doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('User record not found - attempting to create it')
          try {
            // Get user email from auth
            const { data: authUser } = await supabase.auth.getUser()
            if (authUser?.user) {
              const { error: createError } = await supabase.from('users').insert({
                id: authUser.user.id,
                email: authUser.user.email!,
                full_name: authUser.user.user_metadata?.full_name || null,
                role: 'user',
              })
              
              if (!createError) {
                // Retry fetching
                const { data: newData } = await supabase
                  .from('users')
                  .select('role, company_id')
                  .eq('id', userId)
                  .single()
                
                if (newData) {
                  setUserRole(newData.role)
                  setCompanyId(newData.company_id)
                }
              } else {
                console.error('Failed to create user record:', createError)
              }
            }
          } catch (createErr) {
            console.error('Error creating user record:', createErr)
          }
        } else {
          console.error('Error fetching user data:', error)
        }
        return
      }

      if (data) {
        setUserRole(data.role)
        setCompanyId(data.company_id)
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error)
      // Don't block login if user data fetch fails
      // User can still access the app, they just won't have role/company set
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserData(session.user.id)
      } else {
        setUserRole(null)
        setCompanyId(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Get fingerprint for security (non-blocking)
      const fingerprint = await getVisitorFingerprint().catch(() => ({
        visitorId: 'unknown',
        confidence: { score: 0 },
      }))
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 15000)
      )

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any

      if (error) {
        if (error.status === 429) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.')
        }
        throw error
      }

      // Log security event (non-blocking) - don't wait for it
      if (data.user) {
        try {
          await supabase.from('security_logs').insert({
            user_id: data.user.id,
            event_type: 'login',
            metadata: { fingerprint: fingerprint.visitorId },
          })
        } catch (logError) {
          console.error('Failed to log security event:', logError)
        }
      }

      // Fetch user data and ensure company association
      if (data.user) {
        fetchUserData(data.user.id).catch(async (error) => {
          console.error('Error fetching user data:', error)
          // If user record doesn't exist, create it
          if (error.code === 'PGRST116') {
            try {
              await supabase.from('users').insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata?.full_name || null,
                role: 'user',
              })
              
              // Check if user has a company, if not create one
              const { data: userData } = await supabase
                .from('users')
                .select('company_id')
                .eq('id', data.user.id)
                .single()
              
              if (userData && !userData.company_id) {
                // Create a company for the user
                const companyName = data.user.user_metadata?.full_name 
                  ? `${data.user.user_metadata.full_name}'s Company`
                  : `${data.user.email?.split('@')[0]}'s Company`
                
                const { data: newCompany } = await supabase
                  .from('companies')
                  .insert({
                    name: companyName,
                    owner_id: data.user.id,
                    subscription_tier: 'free',
                    max_users: 1,
                    max_companies: 1,
                    max_documents: 10,
                  })
                  .select()
                  .single()

                if (newCompany) {
                  // Update user's company_id
                  await supabase
                    .from('users')
                    .update({ company_id: newCompany.id })
                    .eq('id', data.user.id)
                }
              }
              
              // Refresh user data to update context
              await fetchUserData(data.user.id)
            } catch (createError) {
              console.error('Failed to create user record:', createError)
            }
          } else {
            // User exists but might not have company_id - check and create if needed
            const { data: userData } = await supabase
              .from('users')
              .select('company_id')
              .eq('id', data.user.id)
              .single()
            
            if (userData && !userData.company_id) {
              try {
                // Create a company for the user
                const companyName = data.user.user_metadata?.full_name 
                  ? `${data.user.user_metadata.full_name}'s Company`
                  : `${data.user.email?.split('@')[0]}'s Company`
                
                const { data: newCompany } = await supabase
                  .from('companies')
                  .insert({
                    name: companyName,
                    owner_id: data.user.id,
                    subscription_tier: 'free',
                    max_users: 1,
                    max_companies: 1,
                    max_documents: 10,
                  })
                  .select()
                  .single()

                if (newCompany) {
                  // Update user's company_id
                  await supabase
                    .from('users')
                    .update({ company_id: newCompany.id })
                    .eq('id', data.user.id)
                  
                  // Refresh user data to update context immediately
                  await fetchUserData(data.user.id)
                }
              } catch (companyError) {
                console.error('Failed to create company for user:', companyError)
              }
            }
          }
        })
      }
    } catch (error: any) {
      if (error.message) {
        throw error
      }
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  const signUp = async (email: string, password: string, fullName: string, country?: string, currency?: string) => {
    try {
      // Get fingerprint (non-blocking)
      const fingerprint = await getVisitorFingerprint().catch(() => ({
        visitorId: 'unknown',
        confidence: { score: 0 },
      }))

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        // Handle rate limiting specifically
        if (error.status === 429) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.')
        }
        throw error
      }

      if (data.user) {
        // Create user record
        const { error: userError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'user',
        })

        if (userError) {
          console.error('Failed to create user record:', userError)
          // Don't throw here - auth user is created, we can retry user record creation later
        } else {
          // Automatically create a company for the new user
          try {
            const companyName = fullName ? `${fullName}'s Company` : `${data.user.email?.split('@')[0]}'s Company`
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: companyName,
                owner_id: data.user.id,
                subscription_tier: 'free',
                max_users: 1,
                max_companies: 1,
                max_documents: 10,
                country: country || null,
              })
              .select()
              .single()

            if (!companyError && newCompany) {
              // Update user's company_id
              await supabase
                .from('users')
                .update({ company_id: newCompany.id })
                .eq('id', data.user.id)
              
              // Create base currency for the company if currency is provided
              if (currency && newCompany.id) {
                try {
                  const { countries: countryList, getCurrencyByCountry } = await import('@/lib/countries')
                  const currencyInfo = country ? getCurrencyByCountry(country) : null
                  const countryData = country ? countryList.find(c => c.code === country) : null
                  const currencyName = countryData 
                    ? `${countryData.name} Currency`
                    : `${currency} Currency`
                  
                  await supabase.from('currencies').insert({
                    company_id: newCompany.id,
                    currency_code: currency,
                    currency_name: currencyName,
                    symbol: currencyInfo?.symbol || currency,
                    is_base_currency: true,
                    is_active: true,
                  })
                } catch (currencyErr) {
                  console.error('Failed to create currency for company:', currencyErr)
                  // Don't throw - currency can be added later
                }
              }
              
              // Refresh user data to update context
              await fetchUserData(data.user.id)
            }
          } catch (companyErr) {
            console.error('Failed to create company for user:', companyErr)
            // Don't throw - user can create company later
          }
        }

        // Log security event (non-blocking)
        try {
          await supabase.from('security_logs').insert({
            user_id: data.user.id,
            event_type: 'registration',
            metadata: { fingerprint: fingerprint.visitorId },
          })
        } catch (logError) {
          console.error('Failed to log security event:', logError)
        }
      }
    } catch (error: any) {
      // Provide user-friendly error messages
      if (error.message) {
        throw error
      }
      if (error.status === 429) {
        throw new Error('Too many signup attempts. Please wait a few minutes and try again.')
      }
      throw new Error(error.message || 'Failed to sign up. Please try again.')
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
      setUserRole(null)
      setCompanyId(null)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out')
    }
  }

  const refreshUser = async () => {
    if (user) {
      await fetchUserData(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        companyId,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


