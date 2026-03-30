import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { blink } from '../lib/blink'
import { AnimalBiteRecord } from '../types'
import AnimalBiteForm from '../components/AnimalBiteForm'
import { toast } from '@blinkdotnew/ui'
import { ArrowLeft, Printer } from 'lucide-react'

export default function ViewRecordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<AnimalBiteRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await blink.db.animalBiteRecords.get(id!) as Record<string, unknown>
        if (!raw) {
          toast.error('Record not found.')
          navigate('/')
          return
        }
        const r = raw
        setRecord({
          id: r['id'] as string,
          registrationNumber: r['registrationNumber'] as string,
          dateOfVisit: r['dateOfVisit'] as string,
          fullName: r['fullName'] as string,
          address: r['address'] as string,
          contactNumber: r['contactNumber'] as string,
          age: r['age'] as string,
          gender: r['gender'] as string,
          dateOfBirth: r['dateOfBirth'] as string,
          philhealthMember: r['philhealthMember'] as string,
          philhealthNumber: r['philhealthNumber'] as string,
          allergies: r['allergies'] as string,
          immunocompromisedStatus: r['immunocompromisedStatus'] as string,
          specifyIllness: r['specifyIllness'] as string,
          intakeSteroidsChloroquine: Number(r['intakeSteroidsChloroquine']) > 0,
          bp: r['bp'] as string,
          hr: r['hr'] as string,
          rr: r['rr'] as string,
          temp: r['temp'] as string,
          patientWeight: r['patientWeight'] as string,
          bitingAnimal: r['bitingAnimal'] as string,
          bitingAnimalOthers: r['bitingAnimalOthers'] as string,
          ownership: r['ownership'] as string,
          antiRabiesVaccination: r['antiRabiesVaccination'] as string,
          category: r['category'] as string,
          circumstance: r['circumstance'] as string,
          typeOfExposure: r['typeOfExposure'] as string,
          dateOfExposure: r['dateOfExposure'] as string,
          placeOfExposure: r['placeOfExposure'] as string,
          humanArvStatus: r['humanArvStatus'] as string,
          dateLastVaccination: r['dateLastVaccination'] as string,
          biteSiteNotes: r['biteSiteNotes'] as string,
          washingBiteWound: Number(r['washingBiteWound']) > 0,
          fullRegimen: Number(r['fullRegimen']) > 0,
          booster: Number(r['booster']) > 0,
          vaccineGenericName: r['vaccineGenericName'] as string,
          vaccineBrandName: r['vaccineBrandName'] as string,
          vaccineRoute: r['vaccineRoute'] as string,
          day0: r['day0'] as string,
          day3: r['day3'] as string,
          day7: r['day7'] as string,
          day14: r['day14'] as string,
          day2128: r['day2128'] as string,
          ageInMonths: r['ageInMonths'] != null ? Number(r['ageInMonths']) : undefined,
          animalStatusAfterDay14: r['animalStatusAfterDay14'] as string,
          erigHrigComputedDose: r['erigHrigComputedDose'] as string,
          erigHrigActualDose: r['erigHrigActualDose'] as string,
          erigHrigDateGiven: r['erigHrigDateGiven'] as string,
          tetanusWoundType: r['tetanusWoundType'] as string,
          tetanusDateLast: r['tetanusDateLast'] as string,
          tetanusToxoid: r['tetanusToxoid'] as string,
          ats: r['ats'] as string,
          diagnosisNotes: r['diagnosisNotes'] as string,
          progressNotes: r['progressNotes'] as string,
          nurseInCharge: r['nurseInCharge'] as string,
          physicianCharge: r['physicianCharge'] as string,
          createdAt: r['createdAt'] as string,
          updatedAt: r['updatedAt'] as string,
        })
      } catch {
        toast.error('Failed to load record.')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
        Loading record...
      </div>
    )
  }

  if (!record) return null

  return (
    <div className="mx-auto max-w-6xl">
      <div className="executive-panel mb-6 overflow-hidden">
        <div className="border-b border-border/80 px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <button
                onClick={() => navigate('/')}
                className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to records
              </button>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Record Detail</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">{record.fullName}</h1>
              <p className="page-lead mt-2">Registration No. {record.registrationNumber || 'N/A'} · Date of visit {record.dateOfVisit || 'N/A'}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary"
            >
              <Printer className="h-4 w-4" />
              Print record
            </button>
          </div>
        </div>
      </div>
      <AnimalBiteForm
        onSubmit={() => {}}
        saving={false}
        initialData={record}
        readOnly={true}
      />
    </div>
  )
}
