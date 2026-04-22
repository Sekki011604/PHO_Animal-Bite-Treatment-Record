import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { animalBiteRecordSelect, mapAnimalBiteRecord } from '../lib/recordMapper'
import { buildBreakdowns, buildDashboardKpis, buildMunicipalityGenderBreakdown, buildTopBarangays, buildTrend, filterRecords } from '../lib/analytics'
import { getExposureBarangay, getExposureMunicipality } from '../lib/exposureLocation'
import { AnimalBiteRecord } from '../types'

export function useAnimalBiteAnalytics() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMunicipality, setSelectedMunicipalityState] = useState('')
  const [selectedBarangay, setSelectedBarangayState] = useState('')

  const query = useQuery({
    queryKey: ['animal-bite-records', startDate, endDate],
    queryFn: async () => {
      let dbQuery = supabase
        .from('animal_bite_records')
        .select(animalBiteRecordSelect)

      if (startDate) {
        dbQuery = dbQuery.gte('date_of_visit', startDate)
      }

      if (endDate) {
        dbQuery = dbQuery.lte('date_of_visit', endDate)
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

  const records = query.data || []

  const municipalityOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(record => getExposureMunicipality(record))
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right))
  }, [records])

  const barangayOptions = useMemo(() => {
    if (!selectedMunicipality) return []

    return Array.from(
      new Set(
        records
          .filter(record => getExposureMunicipality(record) === selectedMunicipality)
          .map(record => getExposureBarangay(record))
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right))
  }, [records, selectedMunicipality])

  useEffect(() => {
    if (selectedMunicipality && !municipalityOptions.includes(selectedMunicipality)) {
      setSelectedMunicipalityState('')
      setSelectedBarangayState('')
    }
  }, [municipalityOptions, selectedMunicipality])

  useEffect(() => {
    if (selectedBarangay && !barangayOptions.includes(selectedBarangay)) {
      setSelectedBarangayState('')
    }
  }, [barangayOptions, selectedBarangay])

  const setSelectedMunicipality = (value: string) => {
    setSelectedMunicipalityState(value)
    setSelectedBarangayState('')
  }

  const setSelectedBarangay = (value: string) => {
    setSelectedBarangayState(value)
  }

  const filtered = useMemo(() => filterRecords(records, {
    municipality: selectedMunicipality,
    barangay: selectedBarangay,
  }), [records, selectedMunicipality, selectedBarangay])
  const kpis = useMemo(() => buildDashboardKpis(filtered), [filtered])
  const trend = useMemo(() => buildTrend(filtered), [filtered])
  const breakdowns = useMemo(() => buildBreakdowns(filtered), [filtered])
  const topBarangays = useMemo(() => buildTopBarangays(filtered), [filtered])
  const municipalityGender = useMemo(() => buildMunicipalityGenderBreakdown(filtered), [filtered])

  return {
    ...query,
    startDate,
    endDate,
    selectedMunicipality,
    selectedBarangay,
    municipalityOptions,
    barangayOptions,
    setStartDate,
    setEndDate,
    setSelectedMunicipality,
    setSelectedBarangay,
    resetFilters: () => {
      setStartDate('')
      setEndDate('')
      setSelectedMunicipalityState('')
      setSelectedBarangayState('')
    },
    records,
    filtered,
    kpis,
    trend,
    topBarangays,
    municipalityGender,
    ...breakdowns,
  }
}
