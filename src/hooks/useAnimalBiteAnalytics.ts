import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapAnimalBiteRecord } from '../lib/recordMapper'
import { buildBreakdowns, buildDashboardKpis, buildTopBarangays, buildTrend, filterRecords } from '../lib/analytics'
import { AnimalBiteRecord } from '../types'

export function useAnimalBiteAnalytics() {
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['animal-bite-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animal_bite_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        throw error
      }

      return ((data || []) as Record<string, unknown>[]).map(mapAnimalBiteRecord) as AnimalBiteRecord[]
    },
  })

  const filtered = useMemo(() => filterRecords(query.data || [], month, search), [query.data, month, search])
  const kpis = useMemo(() => buildDashboardKpis(filtered), [filtered])
  const trend = useMemo(() => buildTrend(filtered), [filtered])
  const breakdowns = useMemo(() => buildBreakdowns(filtered), [filtered])
  const topBarangays = useMemo(() => buildTopBarangays(filtered), [filtered])

  return {
    ...query,
    month,
    search,
    setMonth,
    setSearch,
    resetFilters: () => { setMonth(''); setSearch('') },
    records: query.data || [],
    filtered,
    kpis,
    trend,
    topBarangays,
    ...breakdowns,
  }
}
