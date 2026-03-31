import { useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function SystemMaintenancePage() {
  const { role } = useAuth()
  const [clearing, setClearing] = useState(false)

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const handleWipe = async () => {
    const confirmed = window.confirm('Are you sure? This will wipe ALL records and reset the Registry ID to 1.')
    if (!confirmed) return

    setClearing(true)

    const { error } = await supabase.rpc('wipe_all_patient_records')

    if (error) {
      console.error('Cleanup failed:', error)
      alert('Cleanup failed. Please check the console for details.')
      setClearing(false)
      return
    }

    alert('Database successfully wiped. Registry IDs have been reset to 1.')
    setClearing(false)
    window.location.reload()
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section className="rounded-2xl border border-border-lightgreen bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-secondary-gold p-2 text-text-darkgreen">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-gold-dark">Admin Only</p>
            <h1 className="mt-1 text-2xl font-semibold text-text-darkgreen">System Maintenance</h1>
            <p className="mt-1 text-sm text-pho-text-secondary">
              Use this tool only for full test data reset. This action affects only patient records.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Danger Zone</span>
          </div>

          <p className="mb-4 text-sm text-red-700/90">
            Wipe all rows from the patient records table (<span className="font-semibold">animal_bite_records</span>).
            Staff and admin accounts in profiles are not deleted.
          </p>

          <button
            type="button"
            disabled={clearing}
            onClick={handleWipe}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {clearing ? 'Clearing Data...' : 'Wipe All Patient Data'}
          </button>
        </div>
      </section>
    </div>
  )
}
