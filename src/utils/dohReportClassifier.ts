import { AnimalBiteRecord } from '../types'

export type DOHAgeBucket = 'under_15' | '15_and_above' | 'unknown'
export type DOHBitingAnimalGroup = 'dog' | 'cat' | 'other' | 'unknown'
export type DOHAnimalStatusGroup = 'pet_domestic' | 'stray_free_roaming' | 'unknown'
export type DOHImmunizationHistory = 'immunologically_naive' | 'previously_immunized' | 'unknown'
export type DOHPepEligibility = 'pep_eligible' | 'pep_non_eligible' | 'not_applicable'
export type DOHRegimenType =
  | 'none'
  | 'category_ii_primary_cceev'
  | 'category_ii_booster_cceev'
  | 'category_iii_primary_cceev_rig'
  | 'category_iii_booster_cceev_only'
  | 'category_ii_non_eligible'
  | 'category_iii_non_eligible'
  | 'unknown'
export type DOHCompletionStatus = 'completed' | 'incomplete' | 'not_applicable'
export type DOHRigType = 'erig' | 'hrig' | 'none' | 'unknown'
export type DOHDoseKey = 'day0' | 'day3' | 'day7' | 'day14' | 'day2128'

export interface DOHHighRiskCriteria {
  vaccinatedAnimalAvailableForObservation: boolean
  previouslyVaccinatedOverSixMonths: boolean
  animalUnavailableOrHighRisk: boolean
  highlyInnervatedWound: boolean
  multipleOrDeepWounds: boolean
  uncontrolledComorbidities: boolean
  hardToReachArea: boolean
  any: boolean
}

export interface DOHDoseProgress {
  requiredDoseKeys: DOHDoseKey[]
  documentedDoseKeys: DOHDoseKey[]
  documentedLocationKeys: DOHDoseKey[]
  missingDoseKeys: DOHDoseKey[]
  rigAdministered: boolean
}

export interface DOHClassification {
  dohCategory: 'I' | 'II' | 'III' | 'unknown'
  ageBucket: DOHAgeBucket
  bitingAnimalGroup: DOHBitingAnimalGroup
  animalStatusGroup: DOHAnimalStatusGroup
  immunizationHistory: DOHImmunizationHistory
  immunocompromised: boolean
  highRiskCriteria: DOHHighRiskCriteria
  pepEligibility: DOHPepEligibility
  pepEligibilityReason: string
  regimenType: DOHRegimenType
  regimenLabel: string
  rigType: DOHRigType
  completionStatus: DOHCompletionStatus
  completionReason: string
  doseProgress: DOHDoseProgress
}

const HIGHLY_INNERVATED_PATTERN = /\b(head|face|neck|genital|hand|hands|finger|fingers|toe|toes|eye|eyes|mouth|lip|lips|cns)\b/i
const MULTIPLE_OR_DEEP_PATTERN = /\b(multiple|deep|severe|extensive|numerous)\b/i
const HARD_TO_REACH_PATTERN = /\b(remote|hard[- ]?to[- ]?reach|far[- ]?flung|island|mountain)\b/i
const BAT_PATTERN = /\bbat\b/i

const DOSE_LOCATION_KEYS: Record<DOHDoseKey, keyof AnimalBiteRecord> = {
  day0: 'day0Location',
  day3: 'day3Location',
  day7: 'day7Location',
  day14: 'day14Location',
  day2128: 'day2128Location',
}

export function computeDOHClassification(record: AnimalBiteRecord): DOHClassification {
  const dohCategory = resolveCategory(record.category)
  const immunocompromised = isImmunocompromised(record)
  const immunizationHistory = resolveImmunizationHistory(record)
  const ageBucket = resolveAgeBucket(record)
  const bitingAnimalGroup = resolveBitingAnimalGroup(record)
  const animalStatusGroup = resolveAnimalStatusGroup(record)
  const rigType = resolveRigType(record)
  const highRiskCriteria = resolveHighRiskCriteria(record, immunocompromised, immunizationHistory)

  const eligibility = resolvePepEligibility(record, {
    dohCategory,
    immunocompromised,
    immunizationHistory,
    highRiskCriteria,
    rigType,
  })

  const doseProgress = resolveDoseProgress(record, eligibility.regimenType, immunocompromised)
  const completion = resolveCompletionStatus(eligibility.regimenType, doseProgress, rigType)

  return {
    dohCategory,
    ageBucket,
    bitingAnimalGroup,
    animalStatusGroup,
    immunizationHistory,
    immunocompromised,
    highRiskCriteria,
    pepEligibility: eligibility.pepEligibility,
    pepEligibilityReason: eligibility.reason,
    regimenType: eligibility.regimenType,
    regimenLabel: regimenLabelForType(eligibility.regimenType),
    rigType,
    completionStatus: completion.status,
    completionReason: completion.reason,
    doseProgress,
  }
}

function resolveCategory(value?: string | null): DOHClassification['dohCategory'] {
  const normalized = normalizeText(value).toUpperCase()
  if (normalized === 'I' || normalized === 'II' || normalized === 'III') return normalized
  return 'unknown'
}

function isImmunocompromised(record: AnimalBiteRecord) {
  return record.immunocompromisedStatus === 'immunocompromised' || Boolean(record.intakeSteroidsChloroquine)
}

function resolveImmunizationHistory(record: AnimalBiteRecord): DOHImmunizationHistory {
  const status = normalizeText(record.humanArvStatus)
  if (status === 'complete') return 'previously_immunized'
  if (status === 'incomplete' || status === 'none' || status === '') return 'immunologically_naive'
  return 'unknown'
}

function resolveAgeBucket(record: AnimalBiteRecord): DOHAgeBucket {
  const ageInMonths = resolveAgeInMonths(record)
  if (ageInMonths == null) return 'unknown'
  return ageInMonths < 180 ? 'under_15' : '15_and_above'
}

function resolveBitingAnimalGroup(record: AnimalBiteRecord): DOHBitingAnimalGroup {
  const animal = normalizeText(record.bitingAnimal)
  if (animal === 'dog') return 'dog'
  if (animal === 'cat') return 'cat'
  if (animal === 'others' || normalizeText(record.bitingAnimalOthers)) return 'other'
  return 'unknown'
}

function resolveAnimalStatusGroup(record: AnimalBiteRecord): DOHAnimalStatusGroup {
  const ownership = normalizeText(record.ownership)
  if (ownership === 'owned') return 'pet_domestic'
  if (ownership === 'stray') return 'stray_free_roaming'
  return 'unknown'
}

function resolveRigType(record: AnimalBiteRecord): DOHRigType {
  const rigType = normalizeText(record.rigType)
  if (rigType === 'erig') return 'erig'
  if (rigType === 'hrig') return 'hrig'
  if (rigType === 'none') return 'none'

  if (record.erigHrigActualDose || record.erigHrigComputedDose || record.rigVolume || record.erigHrigDateGiven) {
    return 'unknown'
  }

  return 'none'
}

function resolveHighRiskCriteria(
  record: AnimalBiteRecord,
  immunocompromised: boolean,
  immunizationHistory: DOHImmunizationHistory,
): DOHHighRiskCriteria {
  const referenceDate = parseDate(record.dateOfExposure || record.dateOfVisit || record.createdAt || null)
  const lastVaccinationDate = parseDate(record.dateLastVaccination || null)
  const notesBlob = [
    record.biteSiteNotes,
    record.placeOfExposure,
    record.progressNotes,
    record.diagnosisNotes,
    record.address,
  ].map(normalizeText).join(' ')

  const vaccinatedAnimalAvailableForObservation =
    normalizeText(record.antiRabiesVaccination) === 'with_vaccination' &&
    normalizeText(record.animalStatusAfterDay14) === 'alive'

  const previouslyVaccinatedOverSixMonths =
    immunizationHistory === 'previously_immunized' &&
    Boolean(referenceDate && lastVaccinationDate && monthsBetween(lastVaccinationDate, referenceDate) > 6)

  const animalUnavailableOrHighRisk =
    normalizeText(record.animalStatusAfterDay14) === 'dead' ||
    normalizeText(record.animalStatusAfterDay14) === 'lost' ||
    BAT_PATTERN.test(normalizeText(record.bitingAnimalOthers))

  const highlyInnervatedWound = HIGHLY_INNERVATED_PATTERN.test(notesBlob)
  const multipleOrDeepWounds = MULTIPLE_OR_DEEP_PATTERN.test(notesBlob)
  const uncontrolledComorbidities = immunocompromised || Boolean(normalizeText(record.specifyIllness))
  const hardToReachArea = HARD_TO_REACH_PATTERN.test(notesBlob)

  const any =
    previouslyVaccinatedOverSixMonths ||
    animalUnavailableOrHighRisk ||
    highlyInnervatedWound ||
    multipleOrDeepWounds ||
    uncontrolledComorbidities ||
    hardToReachArea

  return {
    vaccinatedAnimalAvailableForObservation,
    previouslyVaccinatedOverSixMonths,
    animalUnavailableOrHighRisk,
    highlyInnervatedWound,
    multipleOrDeepWounds,
    uncontrolledComorbidities,
    hardToReachArea,
    any,
  }
}

function resolvePepEligibility(
  record: AnimalBiteRecord,
  context: {
    dohCategory: DOHClassification['dohCategory']
    immunocompromised: boolean
    immunizationHistory: DOHImmunizationHistory
    highRiskCriteria: DOHHighRiskCriteria
    rigType: DOHRigType
  },
): {
  pepEligibility: DOHPepEligibility
  regimenType: DOHRegimenType
  reason: string
} {
  const { dohCategory, immunocompromised, immunizationHistory, highRiskCriteria } = context

  if (dohCategory === 'unknown') {
    return {
      pepEligibility: 'not_applicable',
      regimenType: 'unknown',
      reason: 'Record category is missing or invalid.',
    }
  }

  if (dohCategory === 'I') {
    return {
      pepEligibility: 'not_applicable',
      regimenType: 'none',
      reason: 'Category I cases are counted but not classified under PEP-eligible Category II or III regimens.',
    }
  }

  const previouslyImmunizedNonImmunocompromised =
    immunizationHistory === 'previously_immunized' && !immunocompromised
  const naiveOrImmunocompromised =
    immunocompromised || immunizationHistory !== 'previously_immunized'

  if (dohCategory === 'II') {
    const observationException =
      !immunocompromised &&
      immunizationHistory === 'immunologically_naive' &&
      highRiskCriteria.vaccinatedAnimalAvailableForObservation &&
      !highRiskCriteria.any

    if (observationException) {
      return {
        pepEligibility: 'pep_non_eligible',
        regimenType: 'category_ii_non_eligible',
        reason: 'Category II exposure to a vaccinated animal available for 14-day observation without high-risk criteria.',
      }
    }

    if (previouslyImmunizedNonImmunocompromised && !highRiskCriteria.any) {
      return {
        pepEligibility: 'pep_non_eligible',
        regimenType: 'category_ii_non_eligible',
        reason: 'Previously immunized, non-immunocompromised Category II exposure without high-risk criteria.',
      }
    }

    if (naiveOrImmunocompromised) {
      return {
        pepEligibility: 'pep_eligible',
        regimenType: 'category_ii_primary_cceev',
        reason: 'Category II primary CCEEV is indicated for immunologically-naive or immunocompromised patients.',
      }
    }

    return {
      pepEligibility: 'pep_eligible',
      regimenType: 'category_ii_booster_cceev',
      reason: 'Category II booster CCEEV is indicated for previously immunized, non-immunocompromised patients with high-risk criteria.',
    }
  }

  if (previouslyImmunizedNonImmunocompromised && !highRiskCriteria.any) {
    return {
      pepEligibility: 'pep_non_eligible',
      regimenType: 'category_iii_non_eligible',
      reason: 'Previously immunized, non-immunocompromised Category III exposure without high-risk criteria.',
    }
  }

  if (naiveOrImmunocompromised) {
    return {
      pepEligibility: 'pep_eligible',
      regimenType: 'category_iii_primary_cceev_rig',
      reason: 'Category III primary CCEEV + RIG is indicated for immunologically-naive or immunocompromised patients.',
    }
  }

  return {
    pepEligibility: 'pep_eligible',
    regimenType: 'category_iii_booster_cceev_only',
    reason: 'Category III booster CCEEV only is indicated for previously immunized, non-immunocompromised patients with high-risk criteria.',
  }
}

function resolveDoseProgress(
  record: AnimalBiteRecord,
  regimenType: DOHRegimenType,
  immunocompromised: boolean,
): DOHDoseProgress {
  const requiredDoseKeys = resolveRequiredDoseKeys(regimenType, immunocompromised)
  const documentedDoseKeys = requiredDoseKeys.filter((doseKey) => Boolean(normalizeText(record[doseKey] as string | undefined)))
  const documentedLocationKeys = requiredDoseKeys.filter((doseKey) => {
    const locationKey = DOSE_LOCATION_KEYS[doseKey]
    return Boolean(normalizeText(record[locationKey] as string | undefined))
  })
  const missingDoseKeys = requiredDoseKeys.filter((doseKey) => !documentedDoseKeys.includes(doseKey))

  return {
    requiredDoseKeys,
    documentedDoseKeys,
    documentedLocationKeys,
    missingDoseKeys,
    rigAdministered: hasRigAdministration(record),
  }
}

function resolveRequiredDoseKeys(regimenType: DOHRegimenType, immunocompromised: boolean): DOHDoseKey[] {
  if (regimenType === 'category_ii_primary_cceev' || regimenType === 'category_iii_primary_cceev_rig') {
    const doseKeys: DOHDoseKey[] = ['day0', 'day3', 'day7']
    if (immunocompromised) {
      doseKeys.push('day2128')
    }
    return doseKeys
  }

  if (regimenType === 'category_ii_booster_cceev' || regimenType === 'category_iii_booster_cceev_only') {
    return ['day0', 'day3']
  }

  return []
}

function resolveCompletionStatus(
  regimenType: DOHRegimenType,
  doseProgress: DOHDoseProgress,
  rigType: DOHRigType,
): {
  status: DOHCompletionStatus
  reason: string
} {
  if (regimenType === 'none' || regimenType === 'unknown' || regimenType.endsWith('non_eligible')) {
    return {
      status: 'not_applicable',
      reason: 'Completion does not apply to non-eligible or non-PEP records.',
    }
  }

  if (doseProgress.missingDoseKeys.length > 0) {
    return {
      status: 'incomplete',
      reason: `Missing required dose entries: ${doseProgress.missingDoseKeys.join(', ')}.`,
    }
  }

  if (regimenType === 'category_iii_primary_cceev_rig') {
    if (!doseProgress.rigAdministered) {
      return {
        status: 'incomplete',
        reason: 'Category III primary completion requires documented single-dose RIG administration.',
      }
    }

    if (rigType !== 'erig' && rigType !== 'hrig') {
      return {
        status: 'incomplete',
        reason: 'Category III primary completion requires an explicit ERIG or HRIG type.',
      }
    }
  }

  return {
    status: 'completed',
    reason: 'All regimen-specific dose requirements are documented.',
  }
}

function regimenLabelForType(regimenType: DOHRegimenType) {
  switch (regimenType) {
    case 'category_ii_primary_cceev':
      return 'Category II - Primary (CCEEV)'
    case 'category_ii_booster_cceev':
      return 'Category II - Booster (CCEEV)'
    case 'category_ii_non_eligible':
      return 'Category II - PEP Non-Eligible'
    case 'category_iii_primary_cceev_rig':
      return 'Category III - Primary (CCEEV + RIG)'
    case 'category_iii_booster_cceev_only':
      return 'Category III - Booster (CCEEV only)'
    case 'category_iii_non_eligible':
      return 'Category III - PEP Non-Eligible'
    case 'none':
      return 'Not Applicable'
    default:
      return 'Unknown'
  }
}

function hasRigAdministration(record: AnimalBiteRecord) {
  return Boolean(
    normalizeText(record.erigHrigDateGiven) ||
    normalizeText(record.erigHrigActualDose) ||
    normalizeText(record.erigHrigComputedDose) ||
    normalizeText(record.rigVolume),
  )
}

function resolveAgeInMonths(record: AnimalBiteRecord) {
  if (typeof record.ageInMonths === 'number' && !Number.isNaN(record.ageInMonths)) {
    return record.ageInMonths
  }

  if (record.age) {
    const years = /(\d+)\s*yr/.exec(record.age.toLowerCase())
    const months = /(\d+)\s*mo/.exec(record.age.toLowerCase())
    if (years || months) {
      return Number(years?.[1] || 0) * 12 + Number(months?.[1] || 0)
    }
  }

  return null
}

function parseDate(value?: string | null) {
  if (!value) return null

  const normalized = value.length <= 10 ? `${value}T00:00:00` : value
  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function monthsBetween(earlier: Date, later: Date) {
  const years = later.getFullYear() - earlier.getFullYear()
  const months = later.getMonth() - earlier.getMonth()
  const dayAdjustment = later.getDate() < earlier.getDate() ? -1 : 0
  return years * 12 + months + dayAdjustment
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() || ''
}
