import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@blinkdotnew/ui'
import { ArrowLeft, FilePlus2 } from 'lucide-react'
import { blink } from '../lib/blink'
import { AnimalBiteRecord } from '../types'
import AnimalBiteForm from '../components/AnimalBiteForm'

export default function NewRecordPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (data: Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true)
    try {
      const id = `abr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const now = new Date().toISOString()
      const payload = {
        id,
        registrationNumber: data.registrationNumber || '',
        dateOfVisit: data.dateOfVisit || now.slice(0, 10),
        fullName: data.fullName.trim(),
        address: data.address || '',
        contactNumber: data.contactNumber || '',
        age: data.age || '',
        ageInMonths: data.ageInMonths == null ? null : String(data.ageInMonths),
        gender: data.gender || '',
        dateOfBirth: data.dateOfBirth || '',
        philhealthMember: data.philhealthMember || '',
        philhealthNumber: data.philhealthNumber || '',
        allergies: data.allergies || '',
        immunocompromisedStatus: data.immunocompromisedStatus || '',
        specifyIllness: data.specifyIllness || '',
        intakeSteroidsChloroquine: data.intakeSteroidsChloroquine ? '1' : '0',
        bp: data.bp || '',
        hr: data.hr || '',
        rr: data.rr || '',
        temp: data.temp || '',
        patientWeight: data.patientWeight || '',
        bitingAnimal: data.bitingAnimal || '',
        bitingAnimalOthers: data.bitingAnimalOthers || '',
        ownership: data.ownership || '',
        antiRabiesVaccination: data.antiRabiesVaccination || '',
        category: data.category || '',
        circumstance: data.circumstance || '',
        typeOfExposure: data.typeOfExposure || '',
        dateOfExposure: data.dateOfExposure || '',
        placeOfExposure: data.placeOfExposure || '',
        humanArvStatus: data.humanArvStatus || '',
        dateLastVaccination: data.dateLastVaccination || '',
        biteSiteNotes: data.biteSiteNotes || '',
        washingBiteWound: data.washingBiteWound ? '1' : '0',
        fullRegimen: data.fullRegimen ? '1' : '0',
        booster: data.booster ? '1' : '0',
        vaccineGenericName: data.vaccineGenericName || '',
        vaccineBrandName: data.vaccineBrandName || '',
        vaccineRoute: data.vaccineRoute || '',
        day0: data.day0 || '',
        day3: data.day3 || '',
        day7: data.day7 || '',
        day14: data.day14 || '',
        day2128: data.day2128 || '',
        animalStatusAfterDay14: data.animalStatusAfterDay14 || '',
        erigHrigComputedDose: data.erigHrigComputedDose || '',
        erigHrigActualDose: data.erigHrigActualDose || '',
        erigHrigDateGiven: data.erigHrigDateGiven || '',
        tetanusWoundType: data.tetanusWoundType || '',
        tetanusDateLast: data.tetanusDateLast || '',
        tetanusToxoid: data.tetanusToxoid || '',
        ats: data.ats || '',
        diagnosisNotes: data.diagnosisNotes || '',
        progressNotes: data.progressNotes || '',
        nurseInCharge: data.nurseInCharge || '',
        physicianCharge: data.physicianCharge || '',
        createdAt: now,
        updatedAt: now,
      }

      await blink.db.animalBiteRecords.create(payload)

      toast.success('Record saved successfully!')
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to save animal bite record:', err)
      const message = err instanceof Error ? err.message : 'Failed to save record. Please try again.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="executive-panel mb-6 overflow-hidden">
        <div className="border-b border-border/80 px-6 py-5">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to records
          </button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Clinical Data Entry</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">New Animal Bite Treatment Record</h1>
              <p className="page-lead mt-2 max-w-3xl">Create a complete patient encounter record for municipal rabies surveillance, treatment monitoring, and export-ready compliance reporting.</p>
            </div>
            <div className="subtle-panel flex items-center gap-3 px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Province of Palawan</div>
                <div className="text-xs text-muted-foreground">Provincial Health Office submission workflow</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimalBiteForm onSubmit={handleSubmit} saving={saving} />
    </div>
  )
}
