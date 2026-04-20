import { DataTable, EmptyState, Stat } from '@blinkdotnew/ui'
import { CalendarDays, MapPin, Mars, TrendingUp, Users, Venus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, Legend, LabelList } from 'recharts'
import { CountDatum, DashboardKpi, MunicipalityGenderDatum, TrendDatum } from '../../../lib/analytics'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']
const CHART_LABEL_STYLE = { fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 600 }
const CHART_LEGEND_STYLE = { fontSize: 12, color: 'hsl(var(--muted-foreground))' }

const barangayColumns = [
  { accessorKey: 'name', header: 'Barangay' },
  { accessorKey: 'value', header: 'Cases' },
]

export function AnalyticsOverview({
  kpis, trend, category, animal, age, topBarangays, municipalityGender,
}: { kpis: DashboardKpi[]; trend: TrendDatum[]; category: CountDatum[]; animal: CountDatum[]; age: CountDatum[]; topBarangays: CountDatum[]; municipalityGender: MunicipalityGenderDatum[] }) {
  const icons = [Users, CalendarDays, Mars, Venus, MapPin]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi, index) => {
          const Icon = icons[index] || TrendingUp
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

      <ChartCard title="Gender Distribution by Municipality">
        {municipalityGender.length ? <MunicipalityGenderChart data={municipalityGender} /> : <EmptyState title="No municipality data" description="Municipality and gender values are needed to build this view." />}
      </ChartCard>

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
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Legend wrapperStyle={CHART_LEGEND_STYLE} /><Line type="monotone" dataKey="cases" name="Cases" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={{ r: 4 }}><LabelList dataKey="cases" position="top" offset={10} style={CHART_LABEL_STYLE} /></Line></LineChart></ResponsiveContainer></div>
}

function BarBreakdown({ data }: { data: CountDatum[] }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Legend wrapperStyle={CHART_LEGEND_STYLE} /><Bar dataKey="value" name="Cases" radius={[6, 6, 0, 0]}><LabelList dataKey="value" position="top" offset={8} style={CHART_LABEL_STYLE} formatter={(value: number) => value || ''} />{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
}

function PieBreakdown({ data }: { data: CountDatum[] }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 8, right: 72, bottom: 8, left: 72 }}><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} labelLine label={renderPieValueLabel}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={CHART_LEGEND_STYLE} /></PieChart></ResponsiveContainer></div>
}

function MunicipalityGenderChart({ data }: { data: MunicipalityGenderDatum[] }) {
  const chartHeight = Math.max(320, data.length * 52)

  return (
    <div style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 12, right: 48, bottom: 12, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="municipality" type="category" width={140} />
          <Tooltip formatter={(value: number, name: string) => [value, name === 'male' ? 'Male' : 'Female']} />
          <Legend wrapperStyle={CHART_LEGEND_STYLE} formatter={(value) => value === 'male' ? 'Male' : 'Female'} />
          <Bar dataKey="male" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="male" position="right" offset={8} style={CHART_LABEL_STYLE} formatter={(value: number) => value || ''} />
          </Bar>
          <Bar dataKey="female" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="female" position="right" offset={8} style={CHART_LABEL_STYLE} formatter={(value: number) => value || ''} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderPieValueLabel({
  name,
  cx,
  cy,
  midAngle,
  outerRadius,
  value,
}: {
  name?: string
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  value?: number
}) {
  if (value == null || !value || cx == null || cy == null || midAngle == null || outerRadius == null) return null

  const radius = outerRadius + 16
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      fontSize={12}
      fontWeight={600}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${name || 'Item'}: ${value}`}
    </text>
  )
}
