import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSupabaseQuery<T>(
  key: string[],
  table: string,
  options?: {
    select?: string
    filters?: (query: any) => any
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase.from(table).select(options?.select || '*')

      if (options?.filters) {
        query = options.filters(query)
      }

      const { data, error } = await query

      if (error) throw error
      return data as T[]
    },
    enabled: options?.enabled !== false,
  })
}

export function useSupabaseMutation<T>(
  table: string,
  optionsOrKeys?: string[][] | {
    invalidateKeys?: string[][]
    onSuccess?: () => void
    onError?: (error: any) => void
  }
) {
  const queryClient = useQueryClient()
  
  // Handle backward compatibility: if it's an array, treat it as invalidateKeys
  const options = Array.isArray(optionsOrKeys) 
    ? { invalidateKeys: optionsOrKeys }
    : optionsOrKeys

  return useMutation({
    mutationFn: async (data: { type?: 'insert' | 'update' | 'delete'; payload?: any; id?: string; data?: any; method?: string }) => {
      let query: any
      
      // Handle method property for backward compatibility
      const type = data.type || (data.method === 'POST' ? 'insert' : data.method === 'PUT' ? 'update' : data.method === 'DELETE' ? 'delete' : 'insert')

      if (type === 'insert') {
        query = supabase.from(table).insert(data.payload || data.data).select().single()
      } else if (type === 'update') {
        query = supabase.from(table).update(data.payload || data.data).eq('id', data.id).select().single()
      } else if (type === 'delete') {
        query = supabase.from(table).delete().eq('id', data.id)
      }

      const { data: result, error } = await query

      if (error) throw error
      return result as T
    },
    onSuccess: () => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
      if (options?.onSuccess) {
        options.onSuccess()
      }
    },
    onError: options?.onError,
  })
}

