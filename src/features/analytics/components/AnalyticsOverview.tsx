import { DataTable, EmptyState, Stat, StatGroup } from '@blinkdotnew/ui'
import { BarChart3, Droplets, ShieldAlert, Syringe, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from 'recharts'
import { CountDatum, DashboardKpi, TrendDatum } from '../../../lib/analytics'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

const barangayColumns = [
  { accessorKey: 'name', header: 'Barangay' },
  { accessorKey: 'value', header: 'Cases' },
]

export function AnalyticsOverview({
  kpis, trend, category, animal, age, topBarangays,
}: { kpis: DashboardKpi[]; trend: TrendDatum[]; category: CountDatum[]; animal: CountDatum[]; age: CountDatum[]; topBarangays: CountDatum[] }) {
  const icons = [TrendingUp, BarChart3, ShieldAlert, Droplets, Syringe]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi, index) => {
          const Icon = icons[index] || BarChart3
          return <Stat key={kpi.label} label={kpi.label} value={kpi.value} description={kpi.hint} icon={<Icon className="h-4 w-4" />} className="rounded-3xl border border-border/80 bg-card shadow-sm" />
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Monthly Case Trend">
          {trend.length ? <TrendChart data={trend} /> : <EmptyState title="No trend data" description="Cases will appear here once records exist." />}
        </ChartCard>
        <ChartCard title="Category Breakdown">
          {category.length ? <BarBreakdown data={category} /> : <EmptyState title="No category data" description="No matching records for this filter." />}
        </ChartCard>
        <ChartCard title="Animal Type Distribution">
          {animal.length ? <PieBreakdown data={animal} /> : <EmptyState title="No animal data" description="No matching records for this filter." />}
        </ChartCard>
        <ChartCard title="Age Group Distribution">
          {age.length ? <BarBreakdown data={age} /> : <EmptyState title="No age data" description="Age groups need DOB-derived ages." />}
        </ChartCard>
      </div>

      <ChartCard title="Top Barangays by Cases">
        {topBarangays.length ? <DataTable columns={barangayColumns} data={topBarangays} /> : <EmptyState title="No barangay data" description="Addresses will be summarized here." />}
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="executive-panel p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold text-foreground">{title}</h3><div className="h-px flex-1 bg-border/70" /></div>{children}</div>
}

function TrendChart({ data }: { data: TrendDatum[] }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="cases" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
}

function BarBreakdown({ data }: { data: CountDatum[] }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
}

function PieBreakdown({ data }: { data: CountDatum[] }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
}