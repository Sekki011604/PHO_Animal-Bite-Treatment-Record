import { useState, useEffect, useMemo } from 'react'
import { AnimalBiteRecord, dobToAgeInMonths, formatAge } from '../types'
import { municipalities, municipalityBarangayMap } from '../lib/municipalityBarangayMap'

interface Props {
  onSubmit: (data: Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>) => void
  saving: boolean
  initialData?: Partial<AnimalBiteRecord>
  readOnly?: boolean
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Section</div>
      <div className="h-px flex-1 bg-border/80" />
      <div className="text-sm font-semibold text-foreground">{title}</div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="min-w-[140px] shrink-0 pt-2 text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function choiceLabelClass(readOnly = false) {
  return `pho-choice-label ${readOnly ? 'pho-choice-label-disabled' : 'pho-choice-label-interactive'}`
}

function choiceTextClass(readOnly = false) {
  return readOnly ? 'pho-choice-text-disabled' : 'pho-choice-text'
}

function hasStoredRigTreatment(data: Partial<AnimalBiteRecord>) {
  return Boolean(data.rigType || data.rigVolume || data.erigHrigComputedDose || data.erigHrigActualDose || data.erigHrigDateGiven)
}

const GOVERNMENT_UNIT_NONE = 'None / Not Applicable'
const GOVERNMENT_UNIT_OTHER = 'Other'
const GOVERNMENT_UNIT_OPTIONS = ['Government Employee', 'PGP', 'Jail', 'Youth Center'] as const

function computeRigVolume(weight: string | undefined, rigType: string | undefined) {
  const numericWeight = Number(weight)

  if (!Number.isFinite(numericWeight) || numericWeight <= 0) return ''
  if (rigType === 'erig') return ((numericWeight * 40) / 200).toFixed(2)
  if (rigType === 'hrig') return ((numericWeight * 20) / 150).toFixed(2)
  return ''
}

function resolveGovernmentUnitSelection(data: Partial<AnimalBiteRecord>) {
  const govOffice = data.govOffice?.trim() || ''

  if (data.isGovEmployee === false) return GOVERNMENT_UNIT_NONE
  if (!govOffice) return data.isGovEmployee === true ? 'Government Employee' : ''
  if (GOVERNMENT_UNIT_OPTIONS.includes(govOffice as (typeof GOVERNMENT_UNIT_OPTIONS)[number])) {
    return govOffice
  }

  return GOVERNMENT_UNIT_OTHER
}

function TextInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  readOnly = false,
  type = 'text',
  inputMode,
  step,
  min,
  name,
  disabled = false,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  type?: string
  inputMode?: string
  step?: string
  min?: number | string
  name?: string
  disabled?: boolean
}) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      inputMode={inputMode}
      step={step}
      min={min}
      className={`w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 invalid:border-red-500 invalid:ring-red-200 disabled:cursor-not-allowed disabled:bg-secondary/30 ${readOnly ? 'cursor-default bg-secondary/30' : ''} ${className}`}
    />
  )
}

function CheckOption({
  label,
  checked,
  onChange,
  readOnly = false,
  type = 'checkbox',
  name,
  value,
}: {
  label: string
  checked: boolean
  onChange?: (v: boolean) => void
  readOnly?: boolean
  type?: 'checkbox' | 'radio'
  name?: string
  value?: string
}) {
  return (
    <label className={choiceLabelClass(readOnly)}>
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        className="pho-choice-control"
        disabled={readOnly}
      />
      <span className={choiceTextClass(readOnly)}>{label}</span>
    </label>
  )
}

function BooleanChoice({
  label,
  name,
  value,
  onChange,
  readOnly = false,
}: {
  label: string
  name: string
  value: boolean | undefined
  onChange: (value: boolean) => void
  readOnly?: boolean
}) {
  return (
    <div>
      <span className="font-medium text-slate-700">{label}</span>
      <div className="ml-4 mt-1 flex flex-wrap gap-3">
        <CheckOption
          type="radio"
          name={name}
          value="yes"
          label="Yes"
          checked={value === true}
          onChange={checked => {
            if (checked) onChange(true)
          }}
          readOnly={readOnly}
        />
        <CheckOption
          type="radio"
          name={name}
          value="no"
          label="No"
          checked={value === false}
          onChange={checked => {
            if (checked) onChange(false)
          }}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}

function TextAreaInput({
  value,
  onChange,
  placeholder,
  rows,
  readOnly = false,
  className = '',
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  rows: number
  readOnly?: boolean
  className?: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
      readOnly={readOnly}
      rows={rows}
      className={`w-full rounded border border-border bg-muted/30 p-2 text-sm resize-none focus:outline-none focus:border-primary invalid:border-red-500 ${className}`}
      placeholder={placeholder}
    />
  )
}

type FormData = Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>

export default function AnimalBiteForm({ onSubmit, saving, initialData = {}, readOnly = false }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const initialRigType = initialData.rigType || (hasStoredRigTreatment(initialData) ? '' : 'none')
  const initialRigVolume = initialData.rigVolume || initialData.erigHrigComputedDose || ''
  const encodedByName = initialData.profiles?.full_name || 'Unknown Staff'
  const initialGovernmentUnitSelection = resolveGovernmentUnitSelection(initialData)
  const [form, setForm] = useState<FormData>({
    registrationNumber: initialData.registrationNumber || '',
    dateOfVisit: initialData.dateOfVisit || today,
    fullName: initialData.fullName || '',
    municipality: initialData.municipality || '',
    barangay: initialData.barangay || '',
    address: initialData.address || '',
    contactNumber: initialData.contactNumber || '',
    age: initialData.age || '',
    ageInMonths: initialData.ageInMonths,
    gender: initialData.gender || '',
    dateOfBirth: initialData.dateOfBirth || '',
    philhealthMember: initialData.philhealthMember || '',
    philhealthNumber: initialData.philhealthNumber || '',
    isGovEmployee: initialData.isGovEmployee,
    govOffice: initialData.govOffice || '',
    allergies: initialData.allergies || '',
    immunocompromisedStatus: initialData.immunocompromisedStatus || '',
    specifyIllness: initialData.specifyIllness || '',
    intakeSteroidsChloroquine: typeof initialData.intakeSteroidsChloroquine === 'boolean' ? initialData.intakeSteroidsChloroquine : undefined,
    bp: initialData.bp || '',
    hr: initialData.hr || '',
    rr: initialData.rr || '',
    temp: initialData.temp || '',
    patientWeight: initialData.patientWeight || '',
    rigType: initialRigType,
    rigVolume: initialRigVolume,
    bitingAnimal: initialData.bitingAnimal || '',
    bitingAnimalOthers: initialData.bitingAnimalOthers || '',
    ownership: initialData.ownership || '',
    antiRabiesVaccination: initialData.antiRabiesVaccination || '',
    category: initialData.category || '',
    circumstance: initialData.circumstance || '',
    typeOfExposure: initialData.typeOfExposure || '',
    dateOfExposure: initialData.dateOfExposure || '',
    placeOfExposure: initialData.placeOfExposure || '',
    humanArvStatus: initialData.humanArvStatus || '',
    dateLastVaccination: initialData.dateLastVaccination || '',
    biteSiteNotes: initialData.biteSiteNotes || '',
    washingBiteWound: typeof initialData.washingBiteWound === 'boolean' ? initialData.washingBiteWound : undefined,
    fullRegimen: typeof initialData.fullRegimen === 'boolean' ? initialData.fullRegimen : undefined,
    booster: typeof initialData.booster === 'boolean' ? initialData.booster : undefined,
    vaccineGenericName: initialData.vaccineGenericName || '',
    vaccineBrandName: initialData.vaccineBrandName || '',
    vaccineRoute: initialData.vaccineRoute || '',
    day0: initialData.day0 || '',
    day0Location: initialData.day0Location || '',
    day3: initialData.day3 || '',
    day3Location: initialData.day3Location || '',
    day7: initialData.day7 || '',
    day7Location: initialData.day7Location || '',
    day14: initialData.day14 || '',
    day14Location: initialData.day14Location || '',
    day2128: initialData.day2128 || '',
    day2128Location: initialData.day2128Location || '',
    animalStatusAfterDay14: initialData.animalStatusAfterDay14 || '',
    erigHrigComputedDose: initialData.erigHrigComputedDose || '',
    erigHrigActualDose: initialData.erigHrigActualDose || '',
    erigHrigDateGiven: initialData.erigHrigDateGiven || '',
    tetanusWoundType: initialData.tetanusWoundType || '',
    tetanusDateLast: initialData.tetanusDateLast || '',
    tetanusToxoid: initialData.tetanusToxoid || '',
    ats: initialData.ats || '',
    diagnosisNotes: initialData.diagnosisNotes || '',
    progressNotes: initialData.progressNotes || '',
    vaccinatorName: initialData.vaccinatorName || '',
    nurseInCharge: initialData.nurseInCharge || '',
    physicianCharge: initialData.physicianCharge || '',
  })
  const [governmentUnitSelection, setGovernmentUnitSelection] = useState(initialGovernmentUnitSelection)

  // ── Auto-compute Age from Date of Birth ─────────────────────────────────────
  useEffect(() => {
    if (!form.dateOfBirth || readOnly) return
    const months = dobToAgeInMonths(form.dateOfBirth)
    if (months === null) return
    const ageStr = formatAge(months)
    setForm(prev => ({
      ...prev,
      age: ageStr,
      ageInMonths: months,
    }))
  }, [form.dateOfBirth, readOnly])

  useEffect(() => {
    if (readOnly) return

    const nextComputedVolume = computeRigVolume(form.patientWeight, form.rigType)

    setForm((prev) => {
      if ((prev.rigVolume || '') === nextComputedVolume && (prev.erigHrigComputedDose || '') === nextComputedVolume) {
        return prev
      }

      return {
        ...prev,
        rigVolume: nextComputedVolume,
        erigHrigComputedDose: nextComputedVolume,
      }
    })
  }, [form.patientWeight, form.rigType, readOnly])

  const set = (key: keyof FormData, value: string | boolean | number | undefined) => {
    if (readOnly) return

    if (key === 'municipality') {
      setForm(prev => ({ ...prev, municipality: String(value || ''), barangay: '' }))
      return
    }

    setForm(prev => ({ ...prev, [key]: value }))
  }

  const availableBarangays = useMemo(() => {
    if (!form.municipality) return []
    return municipalityBarangayMap[form.municipality] || []
  }, [form.municipality])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedGovernmentUnit = (() => {
      if (governmentUnitSelection === GOVERNMENT_UNIT_NONE) {
        return {
          isGovEmployee: false,
          govOffice: '',
        }
      }

      if (governmentUnitSelection === GOVERNMENT_UNIT_OTHER) {
        return {
          isGovEmployee: true,
          govOffice: (form.govOffice || '').trim(),
        }
      }

      if (governmentUnitSelection) {
        return {
          isGovEmployee: true,
          govOffice: governmentUnitSelection,
        }
      }

      return {
        isGovEmployee: undefined,
        govOffice: '',
      }
    })()

    onSubmit({
      ...form,
      ...normalizedGovernmentUnit,
    })
  }

  const dateInput = (
    key: keyof FormData,
    extraClass = '',
    options: {
      disabled?: boolean
      name?: string
    } = {},
  ) => (
    <input
      type="date"
      name={options.name || String(key)}
      value={(form[key] as string) || ''}
      onChange={e => set(key, e.target.value)}
      readOnly={readOnly}
      disabled={options.disabled}
      className={`rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 invalid:border-red-500 invalid:ring-red-200 disabled:cursor-not-allowed disabled:bg-secondary/30 ${extraClass}`}
    />
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="executive-panel overflow-hidden">
        <div className="border-b border-border/80 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_100%)] px-6 py-6 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">Official Treatment Form</div>
          <div className="mt-2 font-serif text-3xl font-semibold">Animal Bite Treatment Record</div>
          <div className="mt-2 max-w-3xl text-sm text-white/82">Complete the patient, exposure, and treatment details below for a submission-ready provincial health record.</div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-3">
            <FormRow label="Full Name">
              <TextInput name="fullName" value={form.fullName} onChange={v => set('fullName', v)} readOnly={readOnly} />
            </FormRow>
            <FormRow label="Government Unit">
              <div className="space-y-2">
                <select
                  name="governmentUnit"
                  value={governmentUnitSelection}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setGovernmentUnitSelection(nextValue)

                    if (nextValue === GOVERNMENT_UNIT_NONE || nextValue === '') {
                      setForm(prev => ({ ...prev, isGovEmployee: nextValue === GOVERNMENT_UNIT_NONE ? false : undefined, govOffice: '' }))
                      return
                    }

                    if (nextValue === GOVERNMENT_UNIT_OTHER) {
                      setForm(prev => ({ ...prev, isGovEmployee: true, govOffice: '' }))
                      return
                    }

                    setForm(prev => ({ ...prev, isGovEmployee: true, govOffice: nextValue }))
                  }}
                  disabled={readOnly}
                 
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 invalid:border-red-500 invalid:ring-red-200 disabled:cursor-not-allowed disabled:bg-secondary/30"
                >
                  <option value="">Select Government Unit</option>
                  <option value={GOVERNMENT_UNIT_NONE}>{GOVERNMENT_UNIT_NONE}</option>
                  {GOVERNMENT_UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                  <option value={GOVERNMENT_UNIT_OTHER}>{GOVERNMENT_UNIT_OTHER}</option>
                </select>
                {governmentUnitSelection === GOVERNMENT_UNIT_OTHER && (
                  <TextInput
                    name="govOffice"
                    value={form.govOffice || ''}
                    onChange={v => set('govOffice', v)}
                    readOnly={readOnly}
                   
                    placeholder="Specify government unit"
                  />
                )}
              </div>
            </FormRow>
            <FormRow label="Municipality">
              <select
                name="municipality"
               
                disabled={readOnly}
                value={form.municipality || ''}
                onChange={e => set('municipality', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 invalid:border-red-500 invalid:ring-red-200 disabled:cursor-not-allowed disabled:bg-secondary/30"
              >
                <option value="">Select Municipality</option>
                {municipalities.map(municipality => (
                  <option key={municipality} value={municipality}>{municipality}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Barangay">
              <select
                name="barangay"
               
                disabled={readOnly || !form.municipality}
                value={form.barangay || ''}
                onChange={e => set('barangay', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 invalid:border-red-500 invalid:ring-red-200 disabled:cursor-not-allowed disabled:bg-secondary/30"
              >
                <option value="">{form.municipality ? 'Select Barangay' : 'Select Municipality first'}</option>
                {availableBarangays.map(barangay => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Contact Number">
              <TextInput name="contactNumber" value={form.contactNumber || ''} onChange={v => set('contactNumber', v)} readOnly={readOnly} />
            </FormRow>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-slate-700">
                Gender
                
              </span>
              <label className={choiceLabelClass(readOnly)}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === 'male'}
                  onChange={() => set('gender', 'male')}
                  className="pho-choice-control"
                  disabled={readOnly}
                 
                />
                <span className={choiceTextClass(readOnly)}>Male</span>
              </label>
              <label className={choiceLabelClass(readOnly)}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === 'female'}
                  onChange={() => set('gender', 'female')}
                  className="pho-choice-control"
                  disabled={readOnly}
                 
                />
                <span className={choiceTextClass(readOnly)}>Female</span>
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <FormRow label="Date of Visit">
              {dateInput('dateOfVisit', 'w-full')}
            </FormRow>
            <FormRow label="Reg. No.">
              <TextInput
                name="registrationNumber"
                value={form.registrationNumber || ''}
                onChange={v => set('registrationNumber', v)}
                readOnly={readOnly}
               
              />
            </FormRow>
            {readOnly && (
              <FormRow label="Encoded By">
                <TextInput value={encodedByName} readOnly={true} />
              </FormRow>
            )}
            {/* DOB + Auto-Age */}
            <FormRow label="Date of Birth">
              {dateInput('dateOfBirth', 'w-full')}
            </FormRow>
            {/* Age is auto-computed — read-only display with visual cue */}
            <div className="flex items-start gap-2 mb-2">
              <span className="text-sm font-medium text-foreground min-w-[140px] pt-1 shrink-0">
                Age <span className="text-[10px] font-normal text-muted-foreground">(auto)</span>
              </span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  name="age"
                  type="text"
                  value={form.age || ''}
                  readOnly
                 
                  placeholder="Auto-calculated from DOB"
                  className="border-b border-border bg-muted/30 text-sm w-full px-1 py-0.5 cursor-default text-foreground invalid:border-red-500"
                />
                {form.ageInMonths !== undefined && form.ageInMonths !== null && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 bg-secondary px-1.5 py-0.5 rounded">
                    {form.ageInMonths < 12
                      ? '<1 yr'
                      : form.ageInMonths < 60
                      ? '1–4 yrs'
                      : form.ageInMonths < 168
                      ? '5–13 yrs'
                      : '≥14 yrs'}
                  </span>
                )}
              </div>
            </div>
            <FormRow label="Philhealth Member">
              <TextInput name="philhealthMember" value={form.philhealthMember || ''} onChange={v => set('philhealthMember', v)} readOnly={readOnly} />
            </FormRow>
            <FormRow label="Philhealth Number">
              <TextInput name="philhealthNumber" value={form.philhealthNumber || ''} onChange={v => set('philhealthNumber', v)} readOnly={readOnly} />
            </FormRow>
          </div>
        </div>
      </div>

      {/* ── MEDICAL HISTORY + VITAL SIGNS ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Medical History */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4">
          <SectionHeader title="Medical History" />
          <div className="space-y-3">
            <FormRow label="Allergies">
              <TextInput name="allergies" value={form.allergies || ''} onChange={v => set('allergies', v)} readOnly={readOnly} />
            </FormRow>
            <div className="space-y-2 ml-2">
              <span className="font-medium text-slate-700">
                Immunocompromised Status
                
              </span>
              <CheckOption
                type="radio"
                name="immunocompromisedStatus"
                value="not_immunocompromised"
                label="Not Immunocompromised"
                checked={form.immunocompromisedStatus === 'not_immunocompromised'}
                onChange={checked => set('immunocompromisedStatus', checked ? 'not_immunocompromised' : '')}
                readOnly={readOnly}
               
              />
              <CheckOption
                type="radio"
                name="immunocompromisedStatus"
                value="immunocompromised"
                label="Immunocompromised"
                checked={form.immunocompromisedStatus === 'immunocompromised'}
                onChange={checked => set('immunocompromisedStatus', checked ? 'immunocompromised' : '')}
                readOnly={readOnly}
               
              />
              {form.immunocompromisedStatus === 'immunocompromised' && (
                <div className="ml-4 flex items-center gap-2 text-sm">
                  <span>
                    Specify illness
                    
                    :
                  </span>
                  <TextInput
                    name="specifyIllness"
                    value={form.specifyIllness || ''}
                    onChange={v => set('specifyIllness', v)}
                    className="w-32"
                    readOnly={readOnly}
                   
                  />
                </div>
              )}
              <BooleanChoice
                label="Intake of steroids or Chloroquine"
                name="intakeSteroidsChloroquine"
                value={form.intakeSteroidsChloroquine}
                onChange={v => set('intakeSteroidsChloroquine', v)}
                readOnly={readOnly}
               
              />
            </div>
          </div>
        </div>

        {/* Vital Signs + Weight */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-sm uppercase tracking-wide mb-3 text-foreground">Vital Signs</div>
              <div className="space-y-2">
                {(['bp', 'hr', 'rr', 'temp'] as const).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-12 uppercase">
                      {key}
                      :
                    </span>
                    <TextInput
                      name={key}
                      value={form[key] || ''}
                      onChange={v => set(key, v)}
                      readOnly={readOnly}
                     
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm uppercase tracking-wide mb-3 text-foreground">
                Patient Weight
                
              </div>
              <TextInput
                name="patientWeight"
                value={form.patientWeight || ''}
                onChange={v => set('patientWeight', v)}
                placeholder="kg"
                readOnly={readOnly}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
               
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── BITING INCIDENT + ANTI RABIES VACCINE ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* History of Biting Incident */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4">
          <SectionHeader title="History of Biting Incident" />
          <div className="space-y-3 text-sm">
            {/* Biting Animal */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-slate-700">
                Biting Animal:
                
              </span>
              {['dog', 'cat'].map(animal => (
                <CheckOption
                  key={animal}
                  type="radio"
                  name="bitingAnimal"
                  value={animal}
                  label={animal.toUpperCase()}
                  checked={form.bitingAnimal === animal}
                  onChange={checked => {
                    if (checked) set('bitingAnimal', animal)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
              <CheckOption
                type="radio"
                name="bitingAnimal"
                value="others"
                label="OTHERS"
                checked={form.bitingAnimal === 'others'}
                onChange={checked => {
                  if (checked) set('bitingAnimal', 'others')
                }}
                readOnly={readOnly}
               
              />
              {form.bitingAnimal === 'others' && (
                <TextInput
                  name="bitingAnimalOthers"
                  value={form.bitingAnimalOthers || ''}
                  onChange={v => set('bitingAnimalOthers', v)}
                  className="w-24"
                  readOnly={readOnly}
                 
                />
              )}
            </div>

            {/* Ownership */}
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">
                Ownership:
                
              </span>
              {['owned', 'stray'].map(o => (
                <CheckOption
                  key={o}
                  type="radio"
                  name="ownership"
                  value={o}
                  label={o.toUpperCase()}
                  checked={form.ownership === o}
                  onChange={checked => {
                    if (checked) set('ownership', o)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
            </div>

            {/* Anti Rabies Vaccination */}
            <div>
              <span className="font-medium">
                Anti Rabies Vaccination:
                
              </span>
              <div className="ml-4 mt-1 space-y-1">
                <CheckOption
                  type="radio"
                  name="antiRabiesVaccination"
                  value="with_vaccination"
                  label="With vaccination"
                  checked={form.antiRabiesVaccination === 'with_vaccination'}
                  onChange={checked => {
                    if (checked) set('antiRabiesVaccination', 'with_vaccination')
                  }}
                  readOnly={readOnly}
                 
                />
                <CheckOption
                  type="radio"
                  name="antiRabiesVaccination"
                  value="none"
                  label="NONE"
                  checked={form.antiRabiesVaccination === 'none'}
                  onChange={checked => {
                    if (checked) set('antiRabiesVaccination', 'none')
                  }}
                  readOnly={readOnly}
                 
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-slate-700">
                Category:
                
              </span>
              {['I', 'II', 'III'].map(cat => (
                <CheckOption
                  key={cat}
                  type="radio"
                  name="category"
                  value={cat}
                  label={cat}
                  checked={form.category === cat}
                  onChange={checked => {
                    if (checked) set('category', cat)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
            </div>

            {/* Circumstance */}
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">
                Circumstance:
                
              </span>
              {['provoked', 'unprovoked'].map(c => (
                <CheckOption
                  key={c}
                  type="radio"
                  name="circumstance"
                  value={c}
                  label={c.toUpperCase()}
                  checked={form.circumstance === c}
                  onChange={checked => {
                    if (checked) set('circumstance', c)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
            </div>

            {/* Type of Exposure */}
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">
                Type of Exposure:
                
              </span>
              {['bite', 'non_bite'].map(t => (
                <CheckOption
                  key={t}
                  type="radio"
                  name="typeOfExposure"
                  value={t}
                  label={t.replace('_', ' ').toUpperCase()}
                  checked={form.typeOfExposure === t}
                  onChange={checked => {
                    if (checked) set('typeOfExposure', t)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">
                Date of Exposure:
                
              </span>
              {dateInput('dateOfExposure')}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">
                Place of Exposure:
                
              </span>
              <TextInput name="placeOfExposure" value={form.placeOfExposure || ''} onChange={v => set('placeOfExposure', v)} readOnly={readOnly} />
            </div>

            {/* Human ARV */}
            <div>
              <span className="font-medium">
                Human Anti Rabies Vaccination:
                
              </span>
              <div className="ml-4 mt-1 space-y-1">
                <div>
                  <CheckOption
                    type="radio"
                    name="humanArvStatus"
                    value="complete"
                    label="With prior dose, COMPLETE"
                    checked={form.humanArvStatus === 'complete'}
                    onChange={checked => {
                      if (checked) set('humanArvStatus', 'complete')
                    }}
                    readOnly={readOnly}
                   
                  />
                  {(form.humanArvStatus === 'complete' || form.humanArvStatus === 'incomplete') && (
                    <div className="ml-6 flex items-center gap-2 text-xs mt-1">
                      <span>
                        Date of last Vaccination:
                        
                      </span>
                      {dateInput('dateLastVaccination')}
                    </div>
                  )}
                </div>
                <CheckOption
                  type="radio"
                  name="humanArvStatus"
                  value="incomplete"
                  label="With prior dose, INCOMPLETE"
                  checked={form.humanArvStatus === 'incomplete'}
                  onChange={checked => {
                    if (checked) set('humanArvStatus', 'incomplete')
                  }}
                  readOnly={readOnly}
                 
                />
                <CheckOption
                  type="radio"
                  name="humanArvStatus"
                  value="none"
                  label="NONE"
                  checked={form.humanArvStatus === 'none'}
                  onChange={checked => {
                    if (checked) set('humanArvStatus', 'none')
                  }}
                  readOnly={readOnly}
                 
                />
              </div>
            </div>

            {/* Bite Site Notes */}
            <div>
              <span className="font-medium block mb-1">
                Bite Site / Body Part Notes:
                
              </span>
              <TextAreaInput
                value={form.biteSiteNotes || ''}
                onChange={v => set('biteSiteNotes', v)}
                readOnly={readOnly}
               
                rows={2}
                placeholder="Describe bite location on body..."
              />
            </div>
          </div>
        </div>

        {/* Anti Rabies Vaccine */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4">
          <SectionHeader title="Anti Rabies Vaccine" />
          <div className="space-y-3 text-sm">
            <div className="space-y-2 ml-1">
              <BooleanChoice label="Washing of bite wound" name="washingBiteWound" value={form.washingBiteWound} onChange={v => set('washingBiteWound', v)} readOnly={readOnly} />
              <BooleanChoice label="Full Regimen" name="fullRegimen" value={form.fullRegimen} onChange={v => set('fullRegimen', v)} readOnly={readOnly} />
              <BooleanChoice label="Booster" name="booster" value={form.booster} onChange={v => set('booster', v)} readOnly={readOnly} />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">Generic Name:</span>
              <TextInput name="vaccineGenericName" value={form.vaccineGenericName || ''} onChange={v => set('vaccineGenericName', v)} readOnly={readOnly} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">Brand Name:</span>
              <TextInput name="vaccineBrandName" value={form.vaccineBrandName || ''} onChange={v => set('vaccineBrandName', v)} readOnly={readOnly} />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">
                Route:
                
              </span>
              {['id', 'im'].map(r => (
                <CheckOption
                  key={r}
                  type="radio"
                  name="vaccineRoute"
                  value={r}
                  label={r.toUpperCase()}
                  checked={form.vaccineRoute === r}
                  onChange={checked => {
                    if (checked) set('vaccineRoute', r)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">Vaccinator Name:</span>
              <TextInput
                name="vaccinatorName"
                value={form.vaccinatorName || ''}
                onChange={v => set('vaccinatorName', v)}
                readOnly={readOnly}
                placeholder="Optional vaccinator name"
              />
            </div>

            {/* Vaccine Schedule */}
            <div className="space-y-2">
              {(
                [
                  { dateKey: 'day0', locationKey: 'day0Location', label: 'Day 0' },
                  { dateKey: 'day3', locationKey: 'day3Location', label: 'Day 3' },
                  { dateKey: 'day7', locationKey: 'day7Location', label: 'Day 7' },
                  { dateKey: 'day14', locationKey: 'day14Location', label: 'Day 14' },
                  { dateKey: 'day2128', locationKey: 'day2128Location', label: 'Day 21/28' },
                ] as { dateKey: keyof FormData; locationKey: keyof FormData; label: string }[]
              ).map(({ dateKey, locationKey, label }) => (
                <div key={dateKey} className="grid gap-2 sm:grid-cols-[88px_minmax(0,165px)_minmax(0,1fr)] sm:items-center">
                  <span className="font-medium text-xs shrink-0">{label}:</span>
                  <input
                    type="date"
                    value={(form[dateKey] as string) || ''}
                    onChange={e => set(dateKey, e.target.value)}
                    readOnly={readOnly}
                    className="border-b border-border bg-transparent px-1 text-xs focus:outline-none focus:border-primary"
                  />
                  <TextInput
                    name={String(locationKey)}
                    value={(form[locationKey] as string) || ''}
                    onChange={v => set(locationKey, v)}
                    readOnly={readOnly}
                    placeholder="Facility/Location name"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>

            <div>
              <span className="font-medium block mb-1 text-slate-700">
                Status of Animal after Day 14:
                
              </span>
              <div className="flex gap-3 ml-2">
                {['alive', 'dead', 'lost'].map(s => (
                  <CheckOption
                    key={s}
                    type="radio"
                    name="animalStatusAfterDay14"
                    value={s}
                    label={s.toUpperCase()}
                    checked={form.animalStatusAfterDay14 === s}
                    onChange={checked => {
                      if (checked) set('animalStatusAfterDay14', s)
                    }}
                    readOnly={readOnly}
                   
                  />
                ))}
              </div>
            </div>

            {/* ERIG/HRIG */}
            <div className="border-t border-border pt-3">
              <div className="font-semibold uppercase text-xs tracking-wide mb-2">Rabies Immunoglobulin (RIG)</div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium block mb-1 text-slate-700">
                    RIG Type:
                    
                  </span>
                  <div className="flex flex-wrap gap-3 ml-1">
                    {[
                      { value: 'none', label: 'None' },
                      { value: 'erig', label: 'ERIG' },
                      { value: 'hrig', label: 'HRIG' },
                    ].map(({ value, label }) => (
                      <label key={value} className={choiceLabelClass(readOnly)}>
                        <input
                          type="radio"
                          name="rigType"
                          value={value}
                          checked={form.rigType === value}
                          onChange={() => set('rigType', value)}
                          className="pho-choice-control"
                          disabled={readOnly}
                         
                        />
                        <span className={choiceTextClass(readOnly)}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0">Computed Volume:</span>
                  <TextInput
                    name="rigVolume"
                    value={form.rigVolume || ''}
                    readOnly={true}
                    placeholder="Auto-calculated ml"
                    className="bg-secondary/50 font-medium"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                   
                    disabled={form.rigType === 'none'}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0">Actual Volume:</span>
                  <TextInput
                    name="erigHrigActualDose"
                    value={form.erigHrigActualDose || ''}
                    onChange={v => set('erigHrigActualDose', v)}
                    readOnly={readOnly}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                   
                    disabled={!readOnly && form.rigType === 'none'}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0">Date Given:</span>
                  {dateInput('erigHrigDateGiven', '', {
                    disabled: !readOnly && form.rigType === 'none',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ANTI-TETANUS ── */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <SectionHeader title="Anti Tetanus Immunization" />
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-slate-700">
                Type of wound:
                
              </span>
              {['clean', 'dirty'].map(t => (
                <CheckOption
                  key={t}
                  type="radio"
                  name="tetanusWoundType"
                  value={t}
                  label={t.toUpperCase()}
                  checked={form.tetanusWoundType === t}
                  onChange={checked => {
                    if (checked) set('tetanusWoundType', t)
                  }}
                  readOnly={readOnly}
                 
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium w-40 shrink-0">Date of last Anti-Tetanus:</span>
              {dateInput('tetanusDateLast')}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">Tetanus Toxoid:</span>
              <TextInput name="tetanusToxoid" value={form.tetanusToxoid || ''} onChange={v => set('tetanusToxoid', v)} readOnly={readOnly} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">ATS:</span>
              <TextInput name="ats" value={form.ats || ''} onChange={v => set('ats', v)} readOnly={readOnly} />
            </div>
          </div>
        </div>
      </div>

      {/* ── DIAGNOSIS & PROGRESS NOTES ── */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <div className="space-y-4">
          <div>
            <div className="font-semibold text-sm uppercase tracking-wide mb-2">Diagnosis / Management / Doctor's Notes</div>
            <TextAreaInput
              value={form.diagnosisNotes || ''}
              onChange={v => set('diagnosisNotes', v)}
              readOnly={readOnly}
              rows={5}
              className="p-3"
              placeholder="Enter diagnosis, management plan, and doctor's notes..."
            />
          </div>
          <div>
            <div className="font-semibold text-sm uppercase tracking-wide mb-2">Progress Notes</div>
            <TextAreaInput
              value={form.progressNotes || ''}
              onChange={v => set('progressNotes', v)}
              readOnly={readOnly}
              rows={5}
              className="p-3"
              placeholder="Enter progress notes..."
            />
          </div>
        </div>
      </div>

      {/* ── SIGNATURES ── */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <span className="text-sm font-medium block mb-1">Nurse in Charge</span>
            <TextInput name="nurseInCharge" value={form.nurseInCharge || ''} onChange={v => set('nurseInCharge', v)} readOnly={readOnly} />
          </div>
          <div>
            <span className="text-sm font-medium block mb-1">Physician in Charge</span>
            <TextInput name="physicianCharge" value={form.physicianCharge || ''} onChange={v => set('physicianCharge', v)} readOnly={readOnly} />
          </div>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      {!readOnly && (
        <div className="flex justify-end gap-3 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[hsl(210,70%,30%)] hover:bg-[hsl(210,70%,25%)] text-white font-semibold px-8 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      )}
    </form>
  )
}

