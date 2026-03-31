import { Button, EmptyState, Page, PageActions, PageBody, PageDescription, PageHeader, PageTitle, SearchInput, toast } from '@blinkdotnew/ui'
import { Download, LoaderCircle, Printer, RefreshCcw } from 'lucide-react'
import { useAnimalBiteAnalytics } from '../hooks/useAnimalBiteAnalytics'
import { AnalyticsOverview } from '../features/analytics/components/AnalyticsOverview'
import { generatePHOReport } from '../utils/exportExcel'
import { useState } from 'react'

export default function AnalyticsPage() {
  const [exporting, setExporting] = useState(false)
  const {
    isLoading,
    filtered,
    kpis,
    trend,
    category,
    animal,
    age,
    topBarangays,
    startDate,
    endDate,
    search,
    setStartDate,
    setEndDate,
    setSearch,
    resetFilters,
  } = useAnimalBiteAnalytics()

  const exportFiltered = async () => {
    if (filtered.length === 0) {
      toast.error('No records to export.')
      return
    }

    setExporting(true)
    try {
      await generatePHOReport(filtered, startDate, endDate)
      toast.success(`Exported ${filtered.length} records to the PHO workbook.`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate the PHO Excel report.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Reporting and Intelligence</div>
          <PageTitle className="mt-2">Visual Analytics Dashboard</PageTitle>
          <PageDescription className="mt-2 max-w-3xl">Track animal bite cases, age groups, exposure patterns, and executive reporting summaries across the municipal treatment system.</PageDescription>
        </div>
        <PageActions>
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
        </PageActions>
      </PageHeader>
      <PageBody>
        <div className="executive-panel mb-6 p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-foreground">Filter analytics</div>
            <div className="page-lead mt-1">Refine reporting by date range or locate a patient, municipality, barangay, registration number, or physician.</div>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-end">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient, municipality, barangay, registration number, physician..." />
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-w-[160px] flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <span>From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="flex min-w-[160px] flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <span>To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={exportFiltered} disabled={filtered.length === 0 || exporting}>
                {exporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {exporting ? 'Generating...' : 'Export Excel'}
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />Loading analytics...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching records" description="Try a different date range or search query to view analytics." />
        ) : (
          <AnalyticsOverview kpis={kpis} trend={trend} category={category} animal={animal} age={age} topBarangays={topBarangays} />
        )}
      </PageBody>
    </Page>
  )
}
