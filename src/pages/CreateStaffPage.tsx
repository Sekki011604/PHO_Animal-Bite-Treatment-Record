import { useMemo, useState } from 'react'
import { UserPlus2 } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'
import { municipalities, municipalityBarangayMap } from '../lib/municipalityBarangayMap'

type CreateStaffFormState = {
  fullName: string
  email: string
  password: string
  municipality: string
  barangay: string
}

const initialFormState: CreateStaffFormState = {
  fullName: '',
  email: '',
  password: '',
  municipality: '',
  barangay: '',
}

export default function CreateStaffPage() {
  const [form, setForm] = useState<CreateStaffFormState>(initialFormState)

  const barangays = useMemo(() => {
    if (!form.municipality) return []
    return municipalityBarangayMap[form.municipality] || []
  }, [form.municipality])

  const handleChange = (key: keyof CreateStaffFormState, value: string) => {
    if (key === 'municipality') {
      setForm(prev => ({ ...prev, municipality: value, barangay: '' }))
      return
    }

    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast.success('Staff account form submitted (mock).')
    setForm(initialFormState)
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <section className="rounded-2xl border border-border-lightgreen bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-primary-phogreen p-2 text-surface-white">
            <UserPlus2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-gold-dark">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-semibold text-text-darkgreen">Create Staff Account</h1>
            <p className="mt-1 text-sm text-pho-text-secondary">Register a staff user and assign municipality and barangay coverage.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-text-darkgreen">Full Name</label>
            <input
              id="fullName"
              required
              value={form.fullName}
              onChange={event => handleChange('fullName', event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-darkgreen">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={event => handleChange('email', event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
              placeholder="staff@pho.gov"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-darkgreen">Password</label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={event => handleChange('password', event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
              placeholder="Create a temporary password"
            />
          </div>

          <div>
            <label htmlFor="municipality" className="mb-1 block text-sm font-medium text-text-darkgreen">Municipality</label>
            <select
              id="municipality"
              required
              value={form.municipality}
              onChange={event => handleChange('municipality', event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
            >
              <option value="">Select Municipality</option>
              {municipalities.map(municipality => (
                <option key={municipality} value={municipality}>{municipality}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="barangay" className="mb-1 block text-sm font-medium text-text-darkgreen">Barangay</label>
            <select
              id="barangay"
              required
              disabled={!form.municipality}
              value={form.barangay}
              onChange={event => handleChange('barangay', event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition disabled:cursor-not-allowed disabled:bg-muted"
            >
              <option value="">{form.municipality ? 'Select Barangay' : 'Select Municipality first'}</option>
              {barangays.map(barangay => (
                <option key={barangay} value={barangay}>{barangay}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-primary-phogreen px-4 py-2.5 text-sm font-semibold text-surface-white transition hover:bg-primary-phogreen-dark"
            >
              Create Staff Account
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
