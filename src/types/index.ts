export interface AnimalBiteRecord {
  id: string
  encodedBy?: string
  profiles?: {
    full_name?: string | null
  } | null
  registrationNumber?: string
  dateOfVisit?: string
  fullName: string
  municipality?: string
  barangay?: string
  address?: string
  contactNumber?: string
  /** Display string e.g. "3 yrs" or "8 mos" — auto-computed from dateOfBirth */
  age?: string
  /** Exact age in months — used for Excel grouping (<12 = <1yr, 12-59 = 1-4yrs, 60-167 = 5-13yrs, 168+ = 14+) */
  ageInMonths?: number
  gender?: string
  dateOfBirth?: string
  philhealthMember?: string
  philhealthNumber?: string
  isGovEmployee?: boolean
  govOffice?: string
  // Medical History
  allergies?: string
  immunocompromisedStatus?: string // 'not_immunocompromised' | 'immunocompromised' | ''
  specifyIllness?: string
  intakeSteroidsChloroquine?: boolean
  // Vital Signs
  bp?: string
  hr?: string
  rr?: string
  temp?: string
  patientWeight?: string
  rigType?: string // 'none' | 'erig' | 'hrig'
  rigVolume?: string
  // Biting Incident
  bitingAnimal?: string // 'dog' | 'cat' | 'others'
  bitingAnimalOthers?: string
  ownership?: string // 'owned' | 'stray'
  antiRabiesVaccination?: string // 'with_vaccination' | 'none'
  category?: string // 'I' | 'II' | 'III'
  circumstance?: string // 'provoked' | 'unprovoked'
  typeOfExposure?: string // 'bite' | 'non_bite'
  dateOfExposure?: string
  exposureMunicipality?: string
  exposureBarangay?: string
  exposureStreet?: string
  placeOfExposure?: string // Legacy combined incident location string for backward compatibility
  humanArvStatus?: string // 'complete' | 'incomplete' | 'none'
  dateLastVaccination?: string
  biteSiteNotes?: string
  // Anti-Rabies Vaccine
  washingBiteWound?: boolean
  fullRegimen?: boolean
  booster?: boolean
  vaccineGenericName?: string
  vaccineBrandName?: string
  vaccineRoute?: string // 'id' | 'im'
  day0?: string
  day0Location?: string
  day3?: string
  day3Location?: string
  day7?: string
  day7Location?: string
  day14?: string
  day14Location?: string
  /** Day 21 or 28 dose date — stored as day2128 (no underscore) for DB compatibility */
  day2128?: string
  day2128Location?: string
  animalStatusAfterDay14?: string // 'alive' | 'dead' | 'lost'
  // ERIG/HRIG
  erigHrigComputedDose?: string
  erigHrigActualDose?: string
  erigHrigDateGiven?: string
  // Anti-Tetanus
  tetanusWoundType?: string // 'clean' | 'dirty'
  tetanusDateLast?: string
  tetanusToxoid?: string
  ats?: string
  // Notes
  diagnosisNotes?: string
  progressNotes?: string
  vaccinatorName?: string
  nurseInCharge?: string
  physicianCharge?: string
  createdAt?: string
  updatedAt?: string
}

// ── Age helpers ──────────────────────────────────────────────────────────────

/**
 * Given a date string (YYYY-MM-DD), returns the total age in whole months.
 * Returns null if dob is empty or invalid.
 */
export function dobToAgeInMonths(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const dayAdjust = now.getDate() < birth.getDate() ? -1 : 0
  return years * 12 + months + dayAdjust
}

/**
 * Formats age in months into a human-readable string.
 * e.g. 5 → "5 mos", 14 → "1 yr 2 mos", 36 → "3 yrs"
 */
export function formatAge(ageInMonths: number): string {
  if (ageInMonths < 0) return '< 1 mo'
  if (ageInMonths < 12) return `${ageInMonths} mo${ageInMonths === 1 ? '' : 's'}`
  const yrs = Math.floor(ageInMonths / 12)
  const mos = ageInMonths % 12
  if (mos === 0) return `${yrs} yr${yrs === 1 ? '' : 's'}`
  return `${yrs} yr${yrs === 1 ? '' : 's'} ${mos} mo${mos === 1 ? '' : 's'}`
}

/**
 * Maps age in months to the standard DOH age group label.
 */
export function ageGroup(ageInMonths: number): string {
  if (ageInMonths < 12) return '<1'
  if (ageInMonths < 60) return '1-4'
  if (ageInMonths < 168) return '5-13'
  if (ageInMonths < 180) return '14'
  return '15+'
}
