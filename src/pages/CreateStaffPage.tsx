import { useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Trash2, UserPlus2, Users } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'
import { municipalities, municipalityBarangayMap } from '../lib/municipalityBarangayMap'
import { supabase } from '../lib/supabase'

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

type StaffProfile = {
  id: string
  email: string
  full_name: string
  role: string
  municipality: string | null
  barangay: string | null
}

type EditFormState = {
  id: string
  fullName: string
  municipality: string
  barangay: string
}

const initialEditState: EditFormState = {
  id: '',
  fullName: '',
  municipality: '',
  barangay: '',
}

export default function CreateStaffPage() {
  const [form, setForm] = useState<CreateStaffFormState>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState>(initialEditState)
  const [savingEdit, setSavingEdit] = useState(false)

  const barangays = useMemo(() => {
    if (!form.municipality) return []
    return municipalityBarangayMap[form.municipality] || []
  }, [form.municipality])

  const editBarangays = useMemo(() => {
    if (!editForm.municipality) return []
    return municipalityBarangayMap[editForm.municipality] || []
  }, [editForm.municipality])

  const fetchStaff = async () => {
    setLoadingStaff(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, municipality, barangay')
      .eq('role', 'staff')
      .order('full_name', { ascending: true })

    if (error) {
      toast.error(`Failed to fetch staff: ${error.message}`)
      setStaffList([])
      setLoadingStaff(false)
      return
    }

    setStaffList((data || []) as StaffProfile[])
    setLoadingStaff(false)
  }

  useEffect(() => {
    void fetchStaff()
  }, [])

  const handleChange = (key: keyof CreateStaffFormState, value: string) => {
    if (key === 'municipality') {
      setForm(prev => ({ ...prev, municipality: value, barangay: '' }))
      return
    }

    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const normalizedEmail = form.email.trim().toLowerCase()
      const { data: adminSessionData } = await supabase.auth.getSession()
      const adminSession = adminSessionData.session

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: 'staff',
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (!signUpData.user) {
        throw new Error('Unable to create staff account user in auth.')
      }

      const timestamp = new Date().toISOString()
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email: normalizedEmail,
        full_name: form.fullName,
        role: 'staff',
        municipality: form.municipality,
        barangay: form.barangay,
        created_at: timestamp,
        updated_at: timestamp,
      })

      if (profileError) {
        throw profileError
      }

      if (adminSession?.access_token && adminSession.refresh_token) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      toast.success('Staff account created successfully.')
      setForm(initialFormState)
      await fetchStaff()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create staff account.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (staff: StaffProfile) => {
    setEditForm({
      id: staff.id,
      fullName: staff.full_name,
      municipality: staff.municipality || '',
      barangay: staff.barangay || '',
    })
    setIsEditOpen(true)
  }

  const closeEditModal = () => {
    setIsEditOpen(false)
    setEditForm(initialEditState)
    setSavingEdit(false)
  }

  const handleEditChange = (key: keyof EditFormState, value: string) => {
    if (key === 'municipality') {
      setEditForm(prev => ({ ...prev, municipality: value, barangay: '' }))
      return
    }
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editForm.id) return

    setSavingEdit(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.fullName,
        municipality: editForm.municipality,
        barangay: editForm.barangay,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editForm.id)

    if (error) {
      toast.error(`Failed to update staff: ${error.message}`)
      setSavingEdit(false)
      return
    }

    toast.success('Staff profile updated.')
    closeEditModal()
    await fetchStaff()
  }

  const handleDelete = async (staffId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this staff?')
    if (!confirmed) return

    setDeletingId(staffId)

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId)

    if (error) {
      toast.error(`Failed to delete staff: ${error.message}`)
      setDeletingId(null)
      return
    }

    toast.success('Staff deleted successfully.')
    setDeletingId(null)
    await fetchStaff()
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={!form.municipality || submitting}
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
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-phogreen px-4 py-2.5 text-sm font-semibold text-surface-white transition hover:bg-primary-phogreen-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Creating Account...' : 'Create Staff Account'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-pho-text-secondary">
          Note: This action signs up a new Supabase auth user and writes staff details to the profiles table.
        </p>
      </section>

      <section className="rounded-2xl border border-border-lightgreen bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-xl bg-secondary-gold p-2 text-text-darkgreen">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-gold-dark">Staff Registry</p>
            <h2 className="mt-1 text-xl font-semibold text-text-darkgreen">Manage Staff Accounts</h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-lightgreen">
          <table className="w-full text-sm">
            <thead className="bg-surface-cream text-text-darkgreen">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Full Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Municipality</th>
                <th className="px-4 py-3 text-left font-semibold">Barangay</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingStaff ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-pho-text-secondary">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading staff list...
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-pho-text-secondary">No staff records found.</td>
                </tr>
              ) : (
                staffList.map(staff => (
                  <tr key={staff.id} className="border-t border-border-lightgreen">
                    <td className="px-4 py-3 font-medium text-text-darkgreen">{staff.full_name}</td>
                    <td className="px-4 py-3 text-pho-text-secondary">{staff.email}</td>
                    <td className="px-4 py-3 text-pho-text-secondary">{staff.municipality || '—'}</td>
                    <td className="px-4 py-3 text-pho-text-secondary">{staff.barangay || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border-lightgreen bg-white px-3 py-1.5 text-xs font-semibold text-primary-phogreen transition hover:bg-surface-cream"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === staff.id}
                          onClick={() => handleDelete(staff.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === staff.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border-lightgreen bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-text-darkgreen">Edit Staff Account</h3>
              <p className="mt-1 text-sm text-pho-text-secondary">Update staff name and assigned service area.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label htmlFor="editFullName" className="mb-1 block text-sm font-medium text-text-darkgreen">Full Name</label>
                <input
                  id="editFullName"
                  required
                  disabled={savingEdit}
                  value={editForm.fullName}
                  onChange={event => handleEditChange('fullName', event.target.value)}
                  className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
                />
              </div>

              <div>
                <label htmlFor="editMunicipality" className="mb-1 block text-sm font-medium text-text-darkgreen">Municipality</label>
                <select
                  id="editMunicipality"
                  required
                  disabled={savingEdit}
                  value={editForm.municipality}
                  onChange={event => handleEditChange('municipality', event.target.value)}
                  className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map(municipality => (
                    <option key={municipality} value={municipality}>{municipality}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="editBarangay" className="mb-1 block text-sm font-medium text-text-darkgreen">Barangay</label>
                <select
                  id="editBarangay"
                  required
                  disabled={!editForm.municipality || savingEdit}
                  value={editForm.barangay}
                  onChange={event => handleEditChange('barangay', event.target.value)}
                  className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition disabled:cursor-not-allowed disabled:bg-muted"
                >
                  <option value="">{editForm.municipality ? 'Select Barangay' : 'Select Municipality first'}</option>
                  {editBarangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={closeEditModal}
                  className="rounded-xl border border-border-lightgreen bg-white px-4 py-2 text-sm font-semibold text-pho-text-secondary transition hover:bg-surface-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-phogreen px-4 py-2 text-sm font-semibold text-surface-white transition hover:bg-primary-phogreen-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
