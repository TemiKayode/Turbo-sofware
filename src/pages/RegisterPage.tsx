import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toaster'
import { countries, getCurrencyByCountry } from '@/lib/countries'
import { Globe, DollarSign } from 'lucide-react'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState<{ currency: string; symbol: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Update currency when country changes
  useEffect(() => {
    if (country) {
      const currencyInfo = getCurrencyByCountry(country)
      setCurrency(currencyInfo)
    } else {
      setCurrency(null)
    }
  }, [country])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signUp(email, password, fullName, country, currency?.currency || 'USD')
      toast('Account created successfully! Please check your email to verify your account.', 'success')
      // Wait a moment before navigating to show the success message
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      // Show specific error messages
      const errorMessage = error.message || 'Failed to create account'
      toast(errorMessage, 'error')
      
      // If rate limited, show additional help
      if (errorMessage.includes('Too many')) {
        setTimeout(() => {
          toast('Please wait 5-10 minutes before trying again.', 'default')
        }, 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="country" className="block text-sm font-medium mb-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Country of Use
                </div>
              </Label>
              <Select value={country} onValueChange={setCountry} required disabled={loading}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countries
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {currency && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Currency: {currency.currency} ({currency.symbol})
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  This currency will be set as your base currency for all transactions
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !country}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
