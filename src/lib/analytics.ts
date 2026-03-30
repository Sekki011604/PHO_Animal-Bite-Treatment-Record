import { AnimalBiteRecord, ageGroup } from '../types'

export type CountDatum = { name: string; value: number }
export type TrendDatum = { month: string; cases: number }
export type DashboardKpi = { label: string; value: string; hint: string }

const inc = (map: Record<string, number>, key: string) => { map[key] = (map[key] || 0) + 1 }
const sortCounts = (map: Record<string, number>) => Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

export function filterRecords(records: AnimalBiteRecord[], month: string, search: string) {
  return records.filter((r) => {
    const matchesMonth = !month || (r.dateOfVisit || '').startsWith(month)
    const hay = `${r.fullName} ${r.registrationNumber} ${r.address} ${r.physicianCharge}`.toLowerCase()
    const matchesSearch = !search || hay.includes(search.toLowerCase())
    return matchesMonth && matchesSearch
  })
}

export function buildDashboardKpis(records: AnimalBiteRecord[]): DashboardKpi[] {
  const prefix = new Date().toISOString().slice(0, 7)
  return [
    { label: 'Total Cases', value: String(records.length), hint: 'All submitted records' },
    { label: 'This Month', value: String(records.filter((r) => (r.dateOfVisit || '').startsWith(prefix)).length), hint: 'Current month submissions' },
    { label: 'Category III', value: String(records.filter((r) => r.category === 'III').length), hint: 'High-priority exposures' },
    { label: 'Wound Washed', value: String(records.filter((r) => r.washingBiteWound).length), hint: 'Immediate wound care given' },
    { label: 'Full Regimen', value: String(records.filter((r) => r.fullRegimen).length), hint: 'Completed full PEP regimen' },
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
    const parts = (r.address || '').split(',').map((p) => p.trim()).filter(Boolean)
    const barangay = parts.find((p) => /^brgy\.?/i.test(p)) || parts[0] || 'Unknown'
    inc(counts, barangay)
  })
  return sortCounts(counts).slice(0, limit)
}
