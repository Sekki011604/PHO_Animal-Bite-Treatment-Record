import { AnimalBiteRecord, ageGroup } from '../types'

export type CountDatum = { name: string; value: number }
export type TrendDatum = { month: string; cases: number }
export type DashboardKpi = { label: string; value: string; hint: string }
export type MunicipalityGenderDatum = { municipality: string; male: number; female: number; total: number }
export type RecordFilters = {
  municipality?: string
  barangay?: string
}

const inc = (map: Record<string, number>, key: string) => { map[key] = (map[key] || 0) + 1 }
const sortCounts = (map: Record<string, number>) => Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
const normalize = (value?: string) => (value || '').trim().toLowerCase()

export function filterRecords(records: AnimalBiteRecord[], filters: RecordFilters) {
  const municipality = normalize(filters.municipality)
  const barangay = normalize(filters.barangay)

  return records.filter((r) => {
    const matchesMunicipality = !municipality || normalize(r.municipality) === municipality
    const matchesBarangay = !barangay || normalize(r.barangay) === barangay

    return matchesMunicipality && matchesBarangay
  })
}

export function buildDashboardKpis(records: AnimalBiteRecord[]): DashboardKpi[] {
  const prefix = new Date().toISOString().slice(0, 7)
  const maleCount = records.filter((record) => normalize(record.gender) === 'male').length
  const femaleCount = records.filter((record) => normalize(record.gender) === 'female').length
  const municipalityCounts = new Map<string, number>()

  records.forEach((record) => {
    const municipality = record.municipality?.trim() || 'Unknown'
    municipalityCounts.set(municipality, (municipalityCounts.get(municipality) || 0) + 1)
  })

  const leadingLocality = municipalityCounts.size
    ? Array.from(municipalityCounts.entries()).sort((left, right) => {
        if (right[1] !== left[1]) return right[1] - left[1]
        return left[0].localeCompare(right[0])
      })[0]
    : null

  const leadingLocalityName = leadingLocality?.[0] || 'N/A'
  const leadingLocalityCount = leadingLocality?.[1] || 0
  const localityHint = leadingLocality
    ? `${leadingLocalityCount} case${leadingLocalityCount === 1 ? '' : 's'} recorded`
    : 'No cases recorded'

  return [
    { label: 'Total Cases', value: String(records.length), hint: 'All submitted records' },
    { label: 'This Month', value: String(records.filter((r) => (r.dateOfVisit || '').startsWith(prefix)).length), hint: 'Current month submissions' },
    { label: 'Male Patients', value: String(maleCount), hint: 'Total male cases' },
    { label: 'Female Patients', value: String(femaleCount), hint: 'Total female cases' },
    { label: 'Leading Locality', value: leadingLocalityName, hint: localityHint },
  ]
}

export function buildTrend(records: AnimalBiteRecord[]): TrendDatum[] {
  const counts: Record<string, number> = {}
  records.forEach((r) => { if (r.dateOfVisit) inc(counts, r.dateOfVisit.slice(0, 7)) })
  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([month, cases]) => ({ month, cases }))
}

export function buildBreakdowns(records: AnimalBiteRecord[]) {
  const category: Record<string, number> = {}
  const animal: Record<string, number> = {}
  const ownership: Record<string, number> = {}
  const exposure: Record<string, number> = {}
  const gender: Record<string, number> = {}
  const age: Record<string, number> = { '<1': 0, '1-4': 0, '5-13': 0, '14': 0, '15+': 0, Unknown: 0 }

  records.forEach((r) => {
    inc(category, r.category || 'Unknown')
    inc(animal, r.bitingAnimal === 'others' ? (r.bitingAnimalOthers || 'Others') : (r.bitingAnimal || 'Unknown'))
    inc(ownership, r.ownership || 'Unknown')
    inc(exposure, r.typeOfExposure?.replace('_', ' ') || 'Unknown')
    inc(gender, r.gender || 'Unknown')
    if (typeof r.ageInMonths === 'number') inc(age, ageGroup(r.ageInMonths))
    else inc(age, 'Unknown')
  })

  return {
    category: sortCounts(category),
    animal: sortCounts(animal),
    ownership: sortCounts(ownership),
    exposure: sortCounts(exposure),
    gender: sortCounts(gender),
    age: sortCounts(age),
  }
}

export function buildTopBarangays(records: AnimalBiteRecord[], limit = 8): CountDatum[] {
  const counts: Record<string, number> = {}
  records.forEach((r) => {
    const barangay = (r.barangay || '').trim() || 'Unknown'
    inc(counts, barangay)
  })
  return sortCounts(counts).slice(0, limit)
}

export function buildMunicipalityGenderBreakdown(records: AnimalBiteRecord[]): MunicipalityGenderDatum[] {
  const counts = new Map<string, MunicipalityGenderDatum>()

  records.forEach((record) => {
    const municipality = record.municipality?.trim() || 'Unknown'
    const current = counts.get(municipality) ?? { municipality, male: 0, female: 0, total: 0 }

    current.total += 1

    const gender = (record.gender || '').trim().toLowerCase()
    if (gender === 'male') current.male += 1
    else if (gender === 'female') current.female += 1

    counts.set(municipality, current)
  })

  return Array.from(counts.values()).sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total
    return left.municipality.localeCompare(right.municipality)
  })
}
