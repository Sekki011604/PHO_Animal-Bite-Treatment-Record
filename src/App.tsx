import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, BarChart3, Building2, ShieldCheck, Menu, X, UserPlus2, LogOut } from 'lucide-react'
import RecordsPage from './pages/RecordsPage'
import NewRecordPage from './pages/NewRecordPage'
import ViewRecordPage from './pages/ViewRecordPage'
import AnalyticsPage from './pages/AnalyticsPage'
import LoginPage from './pages/LoginPage'
import CreateStaffPage from './pages/CreateStaffPage'

type UserRole = 'admin' | 'staff'

type AuthState = {
  isAuthenticated: boolean
  userRole: UserRole | null
  email: string | null
}

const MOCK_CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  'admin@pho.gov': { password: 'Admin@123', role: 'admin' },
  'staff@pho.gov': { password: 'Staff@123', role: 'staff' },
}

function SidebarLayout({ userRole, onLogout }: { userRole: UserRole; onLogout: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/new', label: 'Data Entry', icon: FilePlus2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ...(userRole === 'admin' ? [{ to: '/admin/create-staff', label: 'Manage Staff', icon: UserPlus2 }] : []),
  ]

  return (
    <div className="min-h-screen bg-white text-foreground">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 transform flex-col border-r border-border/80 bg-[hsl(var(--sidebar)/0.96)] backdrop-blur-xl transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive || (item.to === '/dashboard' && location.pathname.startsWith('/record/'))
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
          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(false)
              onLogout()
              navigate('/')
            }}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
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

      <div className="flex min-h-screen flex-col bg-white">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-white">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(prev => !prev)}
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white p-2 text-primary shadow-sm transition hover:bg-secondary"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Municipal Operations Dashboard</div>
              <div className="mt-1 text-lg font-semibold text-foreground lg:hidden">Health Forms Digitizer</div>
              <div className="mt-1 hidden text-sm text-muted-foreground lg:block">Manage digital animal bite treatment records, reporting, and analytics.</div>
              </div>
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

        <main className="flex-1 bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Routes>
            <Route path="/dashboard" element={<RecordsPage />} />
            <Route path="/new" element={<NewRecordPage />} />
            <Route path="/record/:id" element={<ViewRecordPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/create-staff" element={userRole === 'admin' ? <CreateStaffPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userRole: null,
    email: null,
  })

  const handleLogin = (email: string, password: string) => {
    const record = MOCK_CREDENTIALS[email.trim().toLowerCase()]
    if (!record || record.password !== password) {
      return { ok: false, message: 'Invalid email or password.' }
    }

    setAuthState({
      isAuthenticated: true,
      userRole: record.role,
      email: email.trim().toLowerCase(),
    })

    return { ok: true as const }
  }

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      email: null,
    })
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/*"
          element={
            authState.isAuthenticated && authState.userRole
              ? <SidebarLayout userRole={authState.userRole} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
