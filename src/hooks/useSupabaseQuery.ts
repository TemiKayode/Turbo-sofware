import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'

export function useSupabaseQuery<T>(
  key: string[],
  table: string,
  options?: {
    select?: string
    filters?: (query: any) => PostgrestFilterBuilder<any, any, any>
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
  invalidateKeys?: string[][]
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { type: 'insert' | 'update' | 'delete'; payload?: any; id?: string }) => {
      let query: any

      if (data.type === 'insert') {
        query = supabase.from(table).insert(data.payload).select().single()
      } else if (data.type === 'update') {
        query = supabase.from(table).update(data.payload).eq('id', data.id).select().single()
      } else if (data.type === 'delete') {
        query = supabase.from(table).delete().eq('id', data.id)
      }

      const { data: result, error } = await query

      if (error) throw error
      return result as T
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
  })
}

