import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from '@blinkdotnew/ui'
import { ArrowLeft, FilePlus2, LoaderCircle, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AnimalBiteRecord } from '../types'
import AnimalBiteForm from '../components/AnimalBiteForm'
import { useAuth } from '../contexts/AuthContext'
import { buildLegacyPlaceOfExposure } from '../lib/exposureLocation'
import { animalBiteRecordSelect, mapAnimalBiteRecord } from '../lib/recordMapper'

type RecordFormLocationState = {
  record?: AnimalBiteRecord
} | null

function buildRecordPayload(
  data: Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>,
  defaultVisitDate: string,
) {
  const normalizedGovOffice = data.isGovEmployee ? (data.govOffice?.trim() || null) : null
  const normalizedExposureMunicipality = data.exposureMunicipality?.trim() || ''
  const normalizedExposureBarangay = data.exposureBarangay?.trim() || ''
  const normalizedExposureStreet = data.exposureStreet?.trim() || ''

  return {
    registration_number: data.registrationNumber || '',
    date_of_visit: data.dateOfVisit || defaultVisitDate,
    full_name: data.fullName.trim(),
    municipality: data.municipality || '',
    barangay: data.barangay || '',
    address: data.address || '',
    contact_number: data.contactNumber || '',
    age: data.age || '',
    age_in_months: data.ageInMonths == null ? null : data.ageInMonths,
    gender: data.gender || '',
    date_of_birth: data.dateOfBirth || null,
    philhealth_member: data.philhealthMember || '',
    philhealth_number: data.philhealthNumber || '',
    is_gov_employee: data.isGovEmployee === true,
    gov_office: normalizedGovOffice,
    allergies: data.allergies || '',
    immunocompromised_status: data.immunocompromisedStatus || '',
    specify_illness: data.specifyIllness || '',
    intake_steroids_chloroquine: !!data.intakeSteroidsChloroquine,
    bp: data.bp || '',
    hr: data.hr || '',
    rr: data.rr || '',
    temp: data.temp || '',
    patient_weight: data.patientWeight || '',
    rig_type: data.rigType || 'none',
    rig_volume: data.rigVolume ? Number(data.rigVolume) : null,
    biting_animal: data.bitingAnimal || '',
    biting_animal_others: data.bitingAnimalOthers || '',
    ownership: data.ownership || '',
    anti_rabies_vaccination: data.antiRabiesVaccination || '',
    category: data.category || '',
    circumstance: data.circumstance || '',
    type_of_exposure: data.typeOfExposure || '',
    date_of_exposure: data.dateOfExposure || null,
    exposure_municipality: normalizedExposureMunicipality,
    exposure_barangay: normalizedExposureBarangay,
    exposure_street: normalizedExposureStreet,
    place_of_exposure: buildLegacyPlaceOfExposure({
      exposureMunicipality: normalizedExposureMunicipality,
      exposureBarangay: normalizedExposureBarangay,
      exposureStreet: normalizedExposureStreet,
      placeOfExposure: data.placeOfExposure,
    }),
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
    day_0_location: data.day0Location || '',
    day3: data.day3 || null,
    day_3_location: data.day3Location || '',
    day7: data.day7 || null,
    day_7_location: data.day7Location || '',
    day14: data.day14 || null,
    day_14_location: data.day14Location || '',
    day2128: data.day2128 || null,
    day_28_location: data.day2128Location || '',
    animal_status_after_day14: data.animalStatusAfterDay14 || '',
    erig_hrig_computed_dose: data.rigVolume || data.erigHrigComputedDose || '',
    erig_hrig_actual_dose: data.erigHrigActualDose || '',
    erig_hrig_date_given: data.erigHrigDateGiven || null,
    tetanus_wound_type: data.tetanusWoundType || '',
    tetanus_date_last: data.tetanusDateLast || null,
    tetanus_toxoid: data.tetanusToxoid || '',
    ats: data.ats || '',
    diagnosis_notes: data.diagnosisNotes || '',
    progress_notes: data.progressNotes || '',
    vaccinator_name: data.vaccinatorName || '',
    nurse_in_charge: data.nurseInCharge || '',
    physician_charge: data.physicianCharge || '',
  }
}

export default function NewRecordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const [saving, setSaving] = useState(false)
  const routeState = (location.state as RecordFormLocationState | null) ?? null
  const routeStateRecord = routeState?.record ?? null
  const routeRecord = routeStateRecord?.id === id ? routeStateRecord : null
  const [editingRecord, setEditingRecord] = useState<AnimalBiteRecord | null>(routeRecord)
  const [loadingRecord, setLoadingRecord] = useState(Boolean(id) && !routeRecord)
  const { user } = useAuth()
  const isEditing = Boolean(id)

  useEffect(() => {
    if (!isEditing || !id) {
      setEditingRecord(null)
      setLoadingRecord(false)
      return
    }

    if (routeRecord?.id === id) {
      setEditingRecord(routeRecord)
      setLoadingRecord(false)
      return
    }

    let active = true

    const loadRecord = async () => {
      setLoadingRecord(true)

      try {
        const { data: raw, error } = await supabase
          .from('animal_bite_records')
          .select(animalBiteRecordSelect)
          .eq('id', id)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (!raw) {
          toast.error('Record not found.')
          navigate('/dashboard', { replace: true })
          return
        }

        if (!active) return
        setEditingRecord(mapAnimalBiteRecord(raw as Record<string, unknown>))
      } catch (err) {
        console.error('Failed to load record for editing:', err)
        toast.error('Failed to load record for editing.')
        navigate('/dashboard', { replace: true })
      } finally {
        if (active) {
          setLoadingRecord(false)
        }
      }
    }

    void loadRecord()

    return () => {
      active = false
    }
  }, [id, isEditing, navigate, routeRecord])

  const handleSubmit = async (data: Omit<AnimalBiteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true)
    try {
      if (!user?.id) {
        throw new Error('You must be signed in to save a record.')
      }

      const now = new Date().toISOString()
      const payload = buildRecordPayload(data, now.slice(0, 10))

      if (isEditing && editingRecord?.id) {
        const editingRecordId = editingRecord.id
        const { error } = await supabase
          .from('animal_bite_records')
          .update({
            ...payload,
            updated_at: now,
          })
          .eq('id', editingRecordId)

        if (error) {
          throw error
        }

        setEditingRecord(null)
        toast.success('Record updated successfully!')
        navigate('/dashboard', {
          replace: true,
          state: { refreshRecords: true, updatedRecordId: editingRecordId },
        })
        return
      }

      const { error } = await supabase
        .from('animal_bite_records')
        .insert([{
          ...payload,
          encoded_by: user.id,
          created_at: now,
          updated_at: now,
        }])

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

  if (loadingRecord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="mr-3 h-8 w-8 animate-spin text-primary" />
        Loading record...
      </div>
    )
  }

  if (isEditing && !editingRecord) return null

  const PageIcon = isEditing ? Pencil : FilePlus2
  const pageEyebrow = isEditing ? 'Record Update' : 'Clinical Data Entry'
  const pageTitle = isEditing ? 'Edit Animal Bite Treatment Record' : 'New Animal Bite Treatment Record'
  const pageLead = isEditing
    ? 'Review the existing patient encounter and update the saved clinical, exposure, and treatment details.'
    : 'Create a complete patient encounter record for municipal rabies surveillance, treatment monitoring, and export-ready compliance reporting.'
  const workflowLabel = isEditing ? 'Provincial Health Office record update' : 'Provincial Health Office submission workflow'

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
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{pageEyebrow}</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">{pageTitle}</h1>
              <p className="page-lead mt-2 max-w-3xl">{pageLead}</p>
            </div>
            <div className="subtle-panel flex items-center gap-3 px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <PageIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Province of Palawan</div>
                <div className="text-xs text-muted-foreground">{workflowLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimalBiteForm onSubmit={handleSubmit} saving={saving} initialData={editingRecord} />
    </div>
  )
}
