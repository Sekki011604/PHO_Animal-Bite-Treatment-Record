import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@blinkdotnew/ui'
import { ArrowLeft, FilePlus2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AnimalBiteRecord } from '../types'
import AnimalBiteForm from '../components/AnimalBiteForm'

export default function NewRecordPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (data: Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const payload = {
        registration_number: data.registrationNumber || '',
        date_of_visit: data.dateOfVisit || now.slice(0, 10),
        full_name: data.fullName.trim(),
        address: data.address || '',
        contact_number: data.contactNumber || '',
        age: data.age || '',
        age_in_months: data.ageInMonths == null ? null : data.ageInMonths,
        gender: data.gender || '',
        date_of_birth: data.dateOfBirth || null,
        philhealth_member: data.philhealthMember || '',
        philhealth_number: data.philhealthNumber || '',
        allergies: data.allergies || '',
        immunocompromised_status: data.immunocompromisedStatus || '',
        specify_illness: data.specifyIllness || '',
        intake_steroids_chloroquine: !!data.intakeSteroidsChloroquine,
        bp: data.bp || '',
        hr: data.hr || '',
        rr: data.rr || '',
        temp: data.temp || '',
        patient_weight: data.patientWeight || '',
        biting_animal: data.bitingAnimal || '',
        biting_animal_others: data.bitingAnimalOthers || '',
        ownership: data.ownership || '',
        anti_rabies_vaccination: data.antiRabiesVaccination || '',
        category: data.category || '',
        circumstance: data.circumstance || '',
        type_of_exposure: data.typeOfExposure || '',
        date_of_exposure: data.dateOfExposure || null,
        place_of_exposure: data.placeOfExposure || '',
        human_arv_status: data.humanArvStatus || '',
        date_last_vaccination: data.dateLastVaccination || null,
        bite_site_notes: data.biteSiteNotes || '',
        washing_bite_wound: !!data.washingBiteWound,
        full_regimen: !!data.fullRegimen,
        booster: !!data.booster,
        vaccine_generic_name: data.vaccineGenericName || '',
        vaccine_brand_name: data.vaccineBrandName || '',
        vaccine_route: data.vaccineRoute || '',
        day0: data.day0 || null,
        day3: data.day3 || null,
        day7: data.day7 || null,
        day14: data.day14 || null,
        day2128: data.day2128 || null,
        animal_status_after_day14: data.animalStatusAfterDay14 || '',
        erig_hrig_computed_dose: data.erigHrigComputedDose || '',
        erig_hrig_actual_dose: data.erigHrigActualDose || '',
        erig_hrig_date_given: data.erigHrigDateGiven || null,
        tetanus_wound_type: data.tetanusWoundType || '',
        tetanus_date_last: data.tetanusDateLast || null,
        tetanus_toxoid: data.tetanusToxoid || '',
        ats: data.ats || '',
        diagnosis_notes: data.diagnosisNotes || '',
        progress_notes: data.progressNotes || '',
        nurse_in_charge: data.nurseInCharge || '',
        physician_charge: data.physicianCharge || '',
        created_at: now,
        updated_at: now,
      }

      const { error } = await supabase
        .from('animal_bite_records')
        .insert(payload)

      if (error) {
        throw error
      }

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
