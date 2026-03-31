import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AnimalBiteRecord } from '../types'
import AnimalBiteForm from '../components/AnimalBiteForm'
import { toast } from '@blinkdotnew/ui'
import { ArrowLeft, Printer } from 'lucide-react'
import { mapAnimalBiteRecord } from '../lib/recordMapper'

export default function ViewRecordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<AnimalBiteRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: raw, error } = await supabase
          .from('animal_bite_records')
          .select('*')
          .eq('id', id!)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (!raw) {
          toast.error('Record not found.')
          navigate('/dashboard')
          return
        }
        setRecord(mapAnimalBiteRecord(raw as Record<string, unknown>))
      } catch {
        toast.error('Failed to load record.')
        navigate('/dashboard')
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
                onClick={() => navigate('/dashboard')}
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
