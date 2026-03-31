import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, BarChart3, Building2, ShieldCheck, Menu, X, UserPlus2, LogOut, Settings2, ChevronDown } from 'lucide-react'
import RecordsPage from './pages/RecordsPage'
import NewRecordPage from './pages/NewRecordPage'
import ViewRecordPage from './pages/ViewRecordPage'
import AnalyticsPage from './pages/AnalyticsPage'
import LoginPage from './pages/LoginPage'
import CreateStaffPage from './pages/CreateStaffPage'
import SystemMaintenancePage from './pages/SystemMaintenancePage'
import { useAuth, type UserRole } from './contexts/AuthContext'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-text-darkgreen">
      <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      Loading PHO System...
    </div>
  )
}

function LoginRoute() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, user, navigate])

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <LoadingScreen />
  }

  return <LoginPage />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function SidebarLayout({
  userRole,
  fullName,
  onLogout,
}: {
  userRole: Exclude<UserRole, null>
  fullName: string
  onLogout: () => Promise<void>
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const displayName = useMemo(() => {
    if (fullName.trim()) return fullName.trim()
    return 'User'
  }, [fullName])

  const roleLabel = userRole === 'admin' ? 'Admin' : 'Staff'

  const initials = useMemo(() => {
    const words = displayName.split(' ').filter(Boolean)
    if (words.length === 0) return 'U'
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }, [displayName])

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/new', label: 'Data Entry', icon: FilePlus2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ...(userRole === 'admin'
      ? [
          { to: '/admin/create-staff', label: 'Manage Staff', icon: UserPlus2 },
          { to: '/admin/system-maintenance', label: 'System Maintenance', icon: Settings2 },
        ]
      : []),
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
              void onLogout().then(() => navigate('/login', { replace: true }))
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="inline-flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-left shadow-sm transition hover:bg-secondary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </span>
                <span className="hidden sm:block">
                  <span className="block text-sm font-semibold text-foreground leading-tight">{displayName}</span>
                  <span className="block text-xs text-accent leading-tight">{roleLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-white p-2 shadow-md">
                  <div className="mb-1 rounded-lg bg-secondary/40 px-3 py-2">
                    <div className="text-sm font-semibold text-foreground">{displayName}</div>
                    <div className="text-xs text-accent">{roleLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      void onLogout().then(() => navigate('/login', { replace: true }))
                    }}
                    className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
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
            <Route path="/admin/system-maintenance" element={userRole === 'admin' ? <SystemMaintenancePage /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, role, fullName, loading, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SidebarLayout userRole={role === 'admin' ? 'admin' : 'staff'} fullName={fullName} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
