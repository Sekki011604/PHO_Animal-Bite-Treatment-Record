import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, BarChart3, Building2, ShieldCheck } from 'lucide-react'
import RecordsPage from './pages/RecordsPage'
import NewRecordPage from './pages/NewRecordPage'
import ViewRecordPage from './pages/ViewRecordPage'
import AnalyticsPage from './pages/AnalyticsPage'

function SidebarLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', label: 'Records Overview', icon: LayoutDashboard, end: true },
    { to: '/new', label: 'New Record', icon: FilePlus2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--secondary))_0%,_hsl(var(--background))_38%,_hsl(var(--background))_100%)] text-foreground lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-border/80 lg:bg-[hsl(var(--sidebar)/0.86)] lg:backdrop-blur-xl">
        <div className="border-b border-border/80 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Provincial Health Office</div>
              <div className="mt-1 font-serif text-xl leading-tight text-foreground">Health Forms Digitizer</div>
              <p className="mt-1 text-sm text-muted-foreground">Municipal Animal Bite and Rabies Reporting System</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-5">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Operations</div>
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-[hsl(var(--sidebar-foreground))] hover:bg-secondary hover:text-foreground'
                    }`
                  }
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${location.pathname === item.to ? 'bg-white/14' : 'bg-secondary text-primary group-hover:bg-white'}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-border/80 p-5">
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Province of Palawan</div>
                <div className="text-xs text-muted-foreground">Public health digital records</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Municipal Operations Dashboard</div>
              <div className="mt-1 text-lg font-semibold text-foreground lg:hidden">Health Forms Digitizer</div>
              <div className="mt-1 hidden text-sm text-muted-foreground lg:block">Manage digital animal bite treatment records, reporting, and analytics.</div>
            </div>
            <button
              onClick={() => navigate('/new')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:translate-y-[-1px] hover:bg-[hsl(var(--primary)/0.92)]"
            >
              <FilePlus2 className="h-4 w-4" />
              New Record
            </button>
          </div>
          <div className="flex border-t border-border/60 bg-card/70 px-2 py-2 lg:hidden">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex-1 rounded-xl px-3 py-2 text-center text-xs font-semibold transition ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Routes>
            <Route path="/" element={<RecordsPage />} />
            <Route path="/new" element={<NewRecordPage />} />
            <Route path="/record/:id" element={<ViewRecordPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SidebarLayout />
    </BrowserRouter>
  )
}
