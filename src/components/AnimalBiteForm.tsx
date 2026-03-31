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

function TextInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  readOnly = false,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 ${readOnly ? 'cursor-default bg-secondary/30' : ''} ${className}`}
    />
  )
}

function CheckOption({
  label,
  checked,
  onChange,
  readOnly = false,
}: {
  label: string
  checked: boolean
  onChange?: (v: boolean) => void
  readOnly?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer text-sm ${readOnly ? 'pointer-events-none' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        className="w-4 h-4 accent-primary"
        readOnly={readOnly}
      />
      <span>{label}</span>
    </label>
  )
}

type FormData = Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>

export default function AnimalBiteForm({ onSubmit, saving, initialData = {}, readOnly = false }: Props) {
  const today = new Date().toISOString().slice(0, 10)

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
    allergies: initialData.allergies || '',
    immunocompromisedStatus: initialData.immunocompromisedStatus || '',
    specifyIllness: initialData.specifyIllness || '',
    intakeSteroidsChloroquine: initialData.intakeSteroidsChloroquine || false,
    bp: initialData.bp || '',
    hr: initialData.hr || '',
    rr: initialData.rr || '',
    temp: initialData.temp || '',
    patientWeight: initialData.patientWeight || '',
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
    washingBiteWound: initialData.washingBiteWound || false,
    fullRegimen: initialData.fullRegimen || false,
    booster: initialData.booster || false,
    vaccineGenericName: initialData.vaccineGenericName || '',
    vaccineBrandName: initialData.vaccineBrandName || '',
    vaccineRoute: initialData.vaccineRoute || '',
    day0: initialData.day0 || '',
    day3: initialData.day3 || '',
    day7: initialData.day7 || '',
    day14: initialData.day14 || '',
    day2128: initialData.day2128 || '',
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
    nurseInCharge: initialData.nurseInCharge || '',
    physicianCharge: initialData.physicianCharge || '',
  })

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
    if (!form.fullName.trim()) {
      alert('Full name is required.')
      return
    }
    if (!form.municipality) {
      alert('Municipality is required.')
      return
    }
    if (!form.barangay) {
      alert('Barangay is required.')
      return
    }
    onSubmit(form)
  }

  const dateInput = (key: keyof FormData, extraClass = '') => (
    <input
      type="date"
      value={(form[key] as string) || ''}
      onChange={e => set(key, e.target.value)}
      readOnly={readOnly}
      className={`rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 ${extraClass}`}
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
              <TextInput value={form.fullName} onChange={v => set('fullName', v)} readOnly={readOnly} />
            </FormRow>
            <FormRow label="Municipality">
              <select
                required
                disabled={readOnly}
                value={form.municipality || ''}
                onChange={e => set('municipality', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-secondary/30"
              >
                <option value="">Select Municipality</option>
                {municipalities.map(municipality => (
                  <option key={municipality} value={municipality}>{municipality}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Barangay">
              <select
                required
                disabled={readOnly || !form.municipality}
                value={form.barangay || ''}
                onChange={e => set('barangay', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-secondary/30"
              >
                <option value="">{form.municipality ? 'Select Barangay' : 'Select Municipality first'}</option>
                {availableBarangays.map(barangay => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Contact Number">
              <TextInput value={form.contactNumber || ''} onChange={v => set('contactNumber', v)} readOnly={readOnly} />
            </FormRow>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">Gender</span>
              <label className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                <input type="radio" name="gender" value="male" checked={form.gender === 'male'} onChange={() => set('gender', 'male')} className="accent-primary" />
                Male
              </label>
              <label className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                <input type="radio" name="gender" value="female" checked={form.gender === 'female'} onChange={() => set('gender', 'female')} className="accent-primary" />
                Female
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <FormRow label="Date of Visit">
              {dateInput('dateOfVisit', 'w-full')}
            </FormRow>
            <FormRow label="Reg. No.">
              <TextInput value={form.registrationNumber || ''} onChange={v => set('registrationNumber', v)} readOnly={readOnly} />
            </FormRow>
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
                  type="text"
                  value={form.age || ''}
                  readOnly
                  placeholder="Auto-calculated from DOB"
                  className="border-b border-border bg-muted/30 text-sm w-full px-1 py-0.5 cursor-default text-foreground"
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
              <TextInput value={form.philhealthMember || ''} onChange={v => set('philhealthMember', v)} readOnly={readOnly} />
            </FormRow>
            <FormRow label="Philhealth Number">
              <TextInput value={form.philhealthNumber || ''} onChange={v => set('philhealthNumber', v)} readOnly={readOnly} />
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
              <TextInput value={form.allergies || ''} onChange={v => set('allergies', v)} readOnly={readOnly} />
            </FormRow>
            <div className="space-y-2 ml-2">
              <CheckOption
                label="Not Immunocompromised"
                checked={form.immunocompromisedStatus === 'not_immunocompromised'}
                onChange={checked => set('immunocompromisedStatus', checked ? 'not_immunocompromised' : '')}
                readOnly={readOnly}
              />
              <CheckOption
                label="Immunocompromised"
                checked={form.immunocompromisedStatus === 'immunocompromised'}
                onChange={checked => set('immunocompromisedStatus', checked ? 'immunocompromised' : '')}
                readOnly={readOnly}
              />
              {form.immunocompromisedStatus === 'immunocompromised' && (
                <div className="ml-4 flex items-center gap-2 text-sm">
                  <span>Specify illness:</span>
                  <TextInput value={form.specifyIllness || ''} onChange={v => set('specifyIllness', v)} className="w-32" readOnly={readOnly} />
                </div>
              )}
              <CheckOption
                label="Intake of steroids or Chloroquine"
                checked={!!form.intakeSteroidsChloroquine}
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
                    <span className="text-sm font-medium w-12 uppercase">{key}:</span>
                    <TextInput value={form[key] || ''} onChange={v => set(key, v)} readOnly={readOnly} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm uppercase tracking-wide mb-3 text-foreground">Patient Weight</div>
              <TextInput value={form.patientWeight || ''} onChange={v => set('patientWeight', v)} placeholder="kg" readOnly={readOnly} />
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
              <span className="font-medium">Biting Animal:</span>
              {['dog', 'cat'].map(animal => (
                <label key={animal} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.bitingAnimal === animal} onChange={e => set('bitingAnimal', e.target.checked ? animal : '')} className="accent-primary w-4 h-4" />
                  <span className="uppercase">{animal}</span>
                </label>
              ))}
              <label className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                <input type="checkbox" checked={form.bitingAnimal === 'others'} onChange={e => set('bitingAnimal', e.target.checked ? 'others' : '')} className="accent-primary w-4 h-4" />
                OTHERS:
              </label>
              {form.bitingAnimal === 'others' && (
                <TextInput value={form.bitingAnimalOthers || ''} onChange={v => set('bitingAnimalOthers', v)} className="w-24" readOnly={readOnly} />
              )}
            </div>

            {/* Ownership */}
            <div className="flex items-center gap-3">
              <span className="font-medium">Ownership:</span>
              {['owned', 'stray'].map(o => (
                <label key={o} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.ownership === o} onChange={e => set('ownership', e.target.checked ? o : '')} className="accent-primary w-4 h-4" />
                  <span className="uppercase">{o}</span>
                </label>
              ))}
            </div>

            {/* Anti Rabies Vaccination */}
            <div>
              <span className="font-medium">Anti Rabies Vaccination:</span>
              <div className="ml-4 mt-1 space-y-1">
                <CheckOption label="With vaccination" checked={form.antiRabiesVaccination === 'with_vaccination'} onChange={c => set('antiRabiesVaccination', c ? 'with_vaccination' : '')} readOnly={readOnly} />
                <CheckOption label="NONE" checked={form.antiRabiesVaccination === 'none'} onChange={c => set('antiRabiesVaccination', c ? 'none' : '')} readOnly={readOnly} />
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium">Category:</span>
              {['I', 'II', 'III'].map(cat => (
                <label key={cat} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.category === cat} onChange={e => set('category', e.target.checked ? cat : '')} className="accent-primary w-4 h-4" />
                  {cat}
                </label>
              ))}
            </div>

            {/* Circumstance */}
            <div className="flex items-center gap-3">
              <span className="font-medium">Circumstance:</span>
              {['provoked', 'unprovoked'].map(c => (
                <label key={c} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.circumstance === c} onChange={e => set('circumstance', e.target.checked ? c : '')} className="accent-primary w-4 h-4" />
                  <span className="uppercase">{c}</span>
                </label>
              ))}
            </div>

            {/* Type of Exposure */}
            <div className="flex items-center gap-3">
              <span className="font-medium">Type of Exposure:</span>
              {['bite', 'non_bite'].map(t => (
                <label key={t} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.typeOfExposure === t} onChange={e => set('typeOfExposure', e.target.checked ? t : '')} className="accent-primary w-4 h-4" />
                  <span className="uppercase">{t.replace('_', ' ')}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Date of Exposure:</span>
              {dateInput('dateOfExposure')}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Place of Exposure:</span>
              <TextInput value={form.placeOfExposure || ''} onChange={v => set('placeOfExposure', v)} readOnly={readOnly} />
            </div>

            {/* Human ARV */}
            <div>
              <span className="font-medium">Human Anti Rabies Vaccination:</span>
              <div className="ml-4 mt-1 space-y-1">
                <div>
                  <CheckOption label="With prior dose, COMPLETE" checked={form.humanArvStatus === 'complete'} onChange={c => set('humanArvStatus', c ? 'complete' : '')} readOnly={readOnly} />
                  {form.humanArvStatus === 'complete' && (
                    <div className="ml-6 flex items-center gap-2 text-xs mt-1">
                      <span>Date of last Vaccination:</span>
                      {dateInput('dateLastVaccination')}
                    </div>
                  )}
                </div>
                <CheckOption label="With prior dose, INCOMPLETE" checked={form.humanArvStatus === 'incomplete'} onChange={c => set('humanArvStatus', c ? 'incomplete' : '')} readOnly={readOnly} />
                <CheckOption label="NONE" checked={form.humanArvStatus === 'none'} onChange={c => set('humanArvStatus', c ? 'none' : '')} readOnly={readOnly} />
              </div>
            </div>

            {/* Bite Site Notes */}
            <div>
              <span className="font-medium block mb-1">Bite Site / Body Part Notes:</span>
              <textarea
                value={form.biteSiteNotes || ''}
                onChange={e => set('biteSiteNotes', e.target.value)}
                readOnly={readOnly}
                rows={2}
                className="w-full border border-border rounded text-sm p-2 bg-muted/30 focus:outline-none focus:border-primary resize-none"
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
              <CheckOption label="Washing of bite wound" checked={!!form.washingBiteWound} onChange={v => set('washingBiteWound', v)} readOnly={readOnly} />
              <CheckOption label="Full Regimen" checked={!!form.fullRegimen} onChange={v => set('fullRegimen', v)} readOnly={readOnly} />
              <CheckOption label="Booster" checked={!!form.booster} onChange={v => set('booster', v)} readOnly={readOnly} />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">Generic Name:</span>
              <TextInput value={form.vaccineGenericName || ''} onChange={v => set('vaccineGenericName', v)} readOnly={readOnly} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">Brand Name:</span>
              <TextInput value={form.vaccineBrandName || ''} onChange={v => set('vaccineBrandName', v)} readOnly={readOnly} />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-medium">Route:</span>
              {['id', 'im'].map(r => (
                <label key={r} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.vaccineRoute === r} onChange={e => set('vaccineRoute', e.target.checked ? r : '')} className="accent-primary w-4 h-4" />
                  <span className="uppercase">{r}</span>
                </label>
              ))}
            </div>

            {/* Vaccine Schedule */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {(
                [
                  { key: 'day0', label: 'Day 0' },
                  { key: 'day3', label: 'Day 3' },
                  { key: 'day7', label: 'Day 7' },
                  { key: 'day14', label: 'Day 14' },
                  { key: 'day2128', label: 'Day 21/28' },
                ] as { key: keyof FormData; label: string }[]
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="font-medium text-xs w-16 shrink-0">{label}:</span>
                  <input
                    type="date"
                    value={(form[key] as string) || ''}
                    onChange={e => set(key, e.target.value)}
                    readOnly={readOnly}
                    className="border-b border-border bg-transparent text-xs flex-1 focus:outline-none focus:border-primary px-1"
                  />
                </div>
              ))}
            </div>

            <div>
              <span className="font-medium block mb-1">Status of Animal after Day 14:</span>
              <div className="flex gap-3 ml-2">
                {['alive', 'dead', 'lost'].map(s => (
                  <label key={s} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                    <input type="checkbox" checked={form.animalStatusAfterDay14 === s} onChange={e => set('animalStatusAfterDay14', e.target.checked ? s : '')} className="accent-primary w-4 h-4" />
                    <span className="uppercase">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ERIG/HRIG */}
            <div className="border-t border-border pt-3">
              <div className="font-semibold uppercase text-xs tracking-wide mb-2">ERIG / HRIG</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0">Computed Dose:</span>
                  <TextInput value={form.erigHrigComputedDose || ''} onChange={v => set('erigHrigComputedDose', v)} readOnly={readOnly} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0">Actual Dose:</span>
                  <TextInput value={form.erigHrigActualDose || ''} onChange={v => set('erigHrigActualDose', v)} readOnly={readOnly} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-28 shrink-0">Date Given:</span>
                  {dateInput('erigHrigDateGiven')}
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
              <span className="font-medium">Type of wound:</span>
              {['clean', 'dirty'].map(t => (
                <label key={t} className={`flex items-center gap-1 cursor-pointer ${readOnly ? 'pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={form.tetanusWoundType === t} onChange={e => set('tetanusWoundType', e.target.checked ? t : '')} className="accent-primary w-4 h-4" />
                  <span className="uppercase">{t}</span>
                </label>
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
              <TextInput value={form.tetanusToxoid || ''} onChange={v => set('tetanusToxoid', v)} readOnly={readOnly} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-28 shrink-0">ATS:</span>
              <TextInput value={form.ats || ''} onChange={v => set('ats', v)} readOnly={readOnly} />
            </div>
          </div>
        </div>
      </div>

      {/* ── DIAGNOSIS & PROGRESS NOTES ── */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <div className="space-y-4">
          <div>
            <div className="font-semibold text-sm uppercase tracking-wide mb-2">Diagnosis / Management / Doctor's Notes</div>
            <textarea
              value={form.diagnosisNotes || ''}
              onChange={e => set('diagnosisNotes', e.target.value)}
              readOnly={readOnly}
              rows={5}
              className="w-full border border-border rounded text-sm p-3 bg-muted/30 focus:outline-none focus:border-primary resize-none"
              placeholder="Enter diagnosis, management plan, and doctor's notes..."
            />
          </div>
          <div>
            <div className="font-semibold text-sm uppercase tracking-wide mb-2">Progress Notes</div>
            <textarea
              value={form.progressNotes || ''}
              onChange={e => set('progressNotes', e.target.value)}
              readOnly={readOnly}
              rows={5}
              className="w-full border border-border rounded text-sm p-3 bg-muted/30 focus:outline-none focus:border-primary resize-none"
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
            <TextInput value={form.nurseInCharge || ''} onChange={v => set('nurseInCharge', v)} readOnly={readOnly} />
          </div>
          <div>
            <span className="text-sm font-medium block mb-1">Physician in Charge</span>
            <TextInput value={form.physicianCharge || ''} onChange={v => set('physicianCharge', v)} readOnly={readOnly} />
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
