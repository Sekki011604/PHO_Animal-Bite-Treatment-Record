import { AnimalBiteRecord } from '../types'

function pick(r: Record<string, unknown>, camel: string, snake?: string) {
  const snakeKey = snake || camel.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)
  return r[camel] ?? r[snakeKey]
}

function asText(value: unknown) {
  if (value == null) return ''
  return String(value)
}

function asBool(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true'
  }
  return false
}

export function mapAnimalBiteRecord(r: Record<string, unknown>): AnimalBiteRecord {
  const ageInMonthsRaw = pick(r, 'ageInMonths', 'age_in_months')

  return {
    id: asText(pick(r, 'id')),
    registrationNumber: asText(pick(r, 'registrationNumber', 'registration_number')),
    dateOfVisit: asText(pick(r, 'dateOfVisit', 'date_of_visit')),
    fullName: asText(pick(r, 'fullName', 'full_name')),
    municipality: asText(pick(r, 'municipality')),
    barangay: asText(pick(r, 'barangay')),
    address: asText(pick(r, 'address')),
    contactNumber: asText(pick(r, 'contactNumber', 'contact_number')),
    age: asText(pick(r, 'age')),
    ageInMonths: ageInMonthsRaw == null || ageInMonthsRaw === '' ? undefined : Number(ageInMonthsRaw),
    gender: asText(pick(r, 'gender')),
    dateOfBirth: asText(pick(r, 'dateOfBirth', 'date_of_birth')),
    philhealthMember: asText(pick(r, 'philhealthMember', 'philhealth_member')),
    philhealthNumber: asText(pick(r, 'philhealthNumber', 'philhealth_number')),
    allergies: asText(pick(r, 'allergies')),
    immunocompromisedStatus: asText(pick(r, 'immunocompromisedStatus', 'immunocompromised_status')),
    specifyIllness: asText(pick(r, 'specifyIllness', 'specify_illness')),
    intakeSteroidsChloroquine: asBool(pick(r, 'intakeSteroidsChloroquine', 'intake_steroids_chloroquine')),
    bp: asText(pick(r, 'bp')),
    hr: asText(pick(r, 'hr')),
    rr: asText(pick(r, 'rr')),
    temp: asText(pick(r, 'temp')),
    patientWeight: asText(pick(r, 'patientWeight', 'patient_weight')),
    bitingAnimal: asText(pick(r, 'bitingAnimal', 'biting_animal')),
    bitingAnimalOthers: asText(pick(r, 'bitingAnimalOthers', 'biting_animal_others')),
    ownership: asText(pick(r, 'ownership')),
    antiRabiesVaccination: asText(pick(r, 'antiRabiesVaccination', 'anti_rabies_vaccination')),
    category: asText(pick(r, 'category')),
    circumstance: asText(pick(r, 'circumstance')),
    typeOfExposure: asText(pick(r, 'typeOfExposure', 'type_of_exposure')),
    dateOfExposure: asText(pick(r, 'dateOfExposure', 'date_of_exposure')),
    placeOfExposure: asText(pick(r, 'placeOfExposure', 'place_of_exposure')),
    humanArvStatus: asText(pick(r, 'humanArvStatus', 'human_arv_status')),
    dateLastVaccination: asText(pick(r, 'dateLastVaccination', 'date_last_vaccination')),
    biteSiteNotes: asText(pick(r, 'biteSiteNotes', 'bite_site_notes')),
    washingBiteWound: asBool(pick(r, 'washingBiteWound', 'washing_bite_wound')),
    fullRegimen: asBool(pick(r, 'fullRegimen', 'full_regimen')),
    booster: asBool(pick(r, 'booster')),
    vaccineGenericName: asText(pick(r, 'vaccineGenericName', 'vaccine_generic_name')),
    vaccineBrandName: asText(pick(r, 'vaccineBrandName', 'vaccine_brand_name')),
    vaccineRoute: asText(pick(r, 'vaccineRoute', 'vaccine_route')),
    day0: asText(pick(r, 'day0')),
    day3: asText(pick(r, 'day3')),
    day7: asText(pick(r, 'day7')),
    day14: asText(pick(r, 'day14')),
    day2128: asText(pick(r, 'day2128', 'day21_28')),
    animalStatusAfterDay14: asText(pick(r, 'animalStatusAfterDay14', 'animal_status_after_day14')),
    erigHrigComputedDose: asText(pick(r, 'erigHrigComputedDose', 'erig_hrig_computed_dose')),
    erigHrigActualDose: asText(pick(r, 'erigHrigActualDose', 'erig_hrig_actual_dose')),
    erigHrigDateGiven: asText(pick(r, 'erigHrigDateGiven', 'erig_hrig_date_given')),
    tetanusWoundType: asText(pick(r, 'tetanusWoundType', 'tetanus_wound_type')),
    tetanusDateLast: asText(pick(r, 'tetanusDateLast', 'tetanus_date_last')),
    tetanusToxoid: asText(pick(r, 'tetanusToxoid', 'tetanus_toxoid')),
    ats: asText(pick(r, 'ats')),
    diagnosisNotes: asText(pick(r, 'diagnosisNotes', 'diagnosis_notes')),
    progressNotes: asText(pick(r, 'progressNotes', 'progress_notes')),
    nurseInCharge: asText(pick(r, 'nurseInCharge', 'nurse_in_charge')),
    physicianCharge: asText(pick(r, 'physicianCharge', 'physician_charge')),
    createdAt: asText(pick(r, 'createdAt', 'created_at')),
    updatedAt: asText(pick(r, 'updatedAt', 'updated_at')),
  }
}