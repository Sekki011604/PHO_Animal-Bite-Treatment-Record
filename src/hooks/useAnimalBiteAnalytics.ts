import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapAnimalBiteRecord } from '../lib/recordMapper'
import { buildBreakdowns, buildDashboardKpis, buildTopBarangays, buildTrend, filterRecords } from '../lib/analytics'
import { AnimalBiteRecord } from '../types'
import { DateFilterOption, getDateRange } from '../lib/dateFilters'

export function useAnimalBiteAnalytics() {
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('All Time')
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['animal-bite-records', dateFilter],
    queryFn: async () => {
      let dbQuery = supabase
        .from('animal_bite_records')
        .select([
          'id',
          'registration_number',
          'date_of_visit',
          'full_name',
          'municipality',
          'barangay',
          'address',
          'physician_charge',
          'category',
          'washing_bite_wound',
          'full_regimen',
          'biting_animal',
          'biting_animal_others',
          'ownership',
          'type_of_exposure',
          'gender',
          'age_in_months',
          'created_at',
        ].join(','))

      const range = getDateRange(dateFilter)
      if (range) {
        dbQuery = dbQuery.gte('created_at', range.start).lte('created_at', range.end)
      }

      const { data, error } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        throw error
      }

      return ((data || []) as Record<string, unknown>[]).map(mapAnimalBiteRecord) as AnimalBiteRecord[]
    },
  })

  const filtered = useMemo(() => filterRecords(query.data || [], search), [query.data, search])
  const kpis = useMemo(() => buildDashboardKpis(filtered), [filtered])
  const trend = useMemo(() => buildTrend(filtered), [filtered])
  const breakdowns = useMemo(() => buildBreakdowns(filtered), [filtered])
  const topBarangays = useMemo(() => buildTopBarangays(filtered), [filtered])

  return {
    ...query,
    dateFilter,
    search,
    setDateFilter,
    setSearch,
    resetFilters: () => { setDateFilter('All Time'); setSearch('') },
    records: query.data || [],
    filtered,
    kpis,
    trend,
    topBarangays,
    ...breakdowns,
  }
}
