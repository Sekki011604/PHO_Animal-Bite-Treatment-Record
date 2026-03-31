import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, FilePlus2, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AnimalBiteRecord } from '../types'
import { exportToExcel } from '../lib/excelExport'
import { toast } from '@blinkdotnew/ui'
import { mapAnimalBiteRecord } from '../lib/recordMapper'

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${color}`}>
      {text}
    </span>
  )
}

function categoryColor(cat: string) {
  if (cat === 'III') return 'bg-red-100 text-red-700'
  if (cat === 'II') return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

export default function RecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<AnimalBiteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [exporting, setExporting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('animal_bite_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) {
        throw error
      }

      const mapped: AnimalBiteRecord[] = ((data || []) as Record<string, unknown>[]).map(mapAnimalBiteRecord)

      setRecords(mapped)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const filtered = records.filter(r => {
    const matchSearch =
      !search ||
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.address?.toLowerCase().includes(search.toLowerCase())

    const matchMonth =
      !monthFilter || (r.dateOfVisit || '').startsWith(monthFilter)

    return matchSearch && matchMonth
  })

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('No records to export.')
      return
    }
    setExporting(true)
    try {
      const label = monthFilter
        ? new Date(monthFilter + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : 'All Records'
      exportToExcel(filtered, label)
      toast.success(`Exported ${filtered.length} records to Excel.`)
    } catch (err) {
      console.error(err)
      toast.error('Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('animal_bite_records')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      toast.success('Record deleted.')
      setDeleteId(null)
      fetchRecords()
    } catch {
      toast.error('Failed to delete record.')
    }
  }

  // Stats
  const totalThisMonth = records.filter(r => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return (r.dateOfVisit || '').startsWith(prefix)
  }).length

  const catIII = records.filter(r => r.category === 'III').length

  return (
    <div className="space-y-6">
      <section className="executive-panel overflow-hidden">
        <div className="border-b border-border/80 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Clinical Records Overview</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">Animal Bite Records</h1>
              <p className="page-lead mt-2 max-w-3xl">Monitor patient intake, treatment categories, and reporting output from a single operations dashboard.</p>
            </div>
            <button
              onClick={() => navigate('/new')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:translate-y-[-1px]"
            >
              <FilePlus2 className="h-4 w-4" />
              Create new record
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-border/70 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Records', value: records.length, tone: 'text-primary' },
            { label: 'This Month', value: totalThisMonth, tone: 'text-[hsl(var(--chart-2))]' },
            { label: 'Category III', value: catIII, tone: 'text-[hsl(var(--destructive))]' },
            { label: 'Filtered Results', value: filtered.length, tone: 'text-[hsl(var(--chart-4))]' },
          ].map(stat => (
            <div key={stat.label} className="subtle-panel px-4 py-4">
              <div className={`text-3xl font-semibold ${stat.tone}`}>{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by patient name, registration number, or address"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <input
              type="month"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-ring/30"
            />
            <button
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="executive-panel flex items-center justify-center py-16 text-muted-foreground">
          <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          Loading records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="executive-panel px-6 py-16 text-center text-muted-foreground">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Search className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold text-foreground">No matching records found</div>
          <div className="mx-auto mt-2 max-w-md text-sm">
            {records.length === 0 ? 'Create your first animal bite treatment record to start building the reporting registry.' : 'Adjust your filters or search terms to view matching patient records.'}
          </div>
        </div>
      ) : (
        <div className="executive-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/70 text-secondary-foreground">
                  <th className="px-4 py-4 text-left font-semibold">Date</th>
                  <th className="px-4 py-4 text-left font-semibold">Reg. No.</th>
                  <th className="px-4 py-4 text-left font-semibold">Patient Name</th>
                  <th className="px-4 py-4 text-left font-semibold hidden md:table-cell">Age/Gender</th>
                  <th className="px-4 py-4 text-left font-semibold hidden lg:table-cell">Animal</th>
                  <th className="px-4 py-4 text-left font-semibold hidden md:table-cell">Category</th>
                  <th className="px-4 py-4 text-left font-semibold hidden lg:table-cell">Exposure</th>
                  <th className="px-4 py-4 text-left font-semibold hidden xl:table-cell">Physician</th>
                  <th className="px-4 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className={`border-t border-border/70 transition hover:bg-secondary/35 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3 text-muted-foreground">{r.dateOfVisit || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.registrationNumber || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {r.age || '—'} · {r.gender ? r.gender.charAt(0).toUpperCase() : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {r.bitingAnimal ? (
                        <Badge
                          text={r.bitingAnimal === 'others' ? `${r.bitingAnimalOthers || 'Others'}` : r.bitingAnimal.toUpperCase()}
                          color={r.bitingAnimal === 'dog' ? 'bg-blue-100 text-blue-700' : r.bitingAnimal === 'cat' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}
                        />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {r.category ? (
                        <Badge text={`Cat. ${r.category}`} color={categoryColor(r.category)} />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell capitalize">
                      {r.typeOfExposure?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{r.physicianCharge || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/record/${r.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/80"
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {records.length} total records
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(211_33%_18%/0.4)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-foreground">Delete Record?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone. The selected animal bite record will be permanently removed from the registry.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
