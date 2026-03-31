import { Button, EmptyState, Page, PageActions, PageBody, PageDescription, PageHeader, PageTitle, SearchInput } from '@blinkdotnew/ui'
import { Download, Printer, RefreshCcw } from 'lucide-react'
import { useAnimalBiteAnalytics } from '../hooks/useAnimalBiteAnalytics'
import { AnalyticsOverview } from '../features/analytics/components/AnalyticsOverview'
import { exportToExcel } from '../lib/excelExport'
import { DATE_FILTER_OPTIONS } from '../lib/dateFilters'

export default function AnalyticsPage() {
  const { isLoading, filtered, kpis, trend, category, animal, age, topBarangays, dateFilter, search, setDateFilter, setSearch, resetFilters } = useAnimalBiteAnalytics()

  const exportFiltered = () => {
    const label = dateFilter.toLowerCase().replace(/\s+/g, '-')
    exportToExcel(filtered, label)
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
          <Button onClick={exportFiltered}><Download className="mr-2 h-4 w-4" />Export Excel</Button>
        </PageActions>
      </PageHeader>
      <PageBody>
        <div className="executive-panel mb-6 p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-foreground">Filter analytics</div>
            <div className="page-lead mt-1">Refine reporting by date range or locate a patient, municipality, barangay, registration number, or physician.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as (typeof DATE_FILTER_OPTIONS)[number])}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              {DATE_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient, municipality, barangay, registration number, physician..." />
            <Button variant="outline" onClick={resetFilters}><RefreshCcw className="mr-2 h-4 w-4" />Reset</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />Loading analytics...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching records" description="Try a different month or search query to view analytics." />
        ) : (
          <AnalyticsOverview kpis={kpis} trend={trend} category={category} animal={animal} age={age} topBarangays={topBarangays} />
        )}
      </PageBody>
    </Page>
  )
}
