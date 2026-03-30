import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

type LoginResult = {
  ok: boolean
  message?: string
}

type LoginPageProps = {
  onLogin: (email: string, password: string) => LoginResult
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const result = onLogin(email, password)
    if (!result.ok) {
      setError(result.message || 'Unable to login.')
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-lightgreen bg-surface-white p-7 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-primary-phogreen p-2 text-surface-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-gold-dark">Provincial Health Office</p>
            <h1 className="mt-1 text-2xl font-semibold text-text-darkgreen">Animal Bite Treatment Record</h1>
            <p className="mt-1 text-sm text-pho-text-secondary">Sign in to continue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-darkgreen" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
              placeholder="name@pho.gov"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-darkgreen" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
              placeholder="Enter your password"
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary-phogreen px-4 py-2.5 text-sm font-semibold text-surface-white transition hover:bg-primary-phogreen-dark"
          >
            Login
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-secondary-gold/40 bg-surface-cream p-3 text-xs text-pho-text-secondary">
          <p className="font-semibold text-text-darkgreen">Mock Credentials</p>
          <p className="mt-1">Admin: admin@pho.gov / Admin@123</p>
          <p>Staff: staff@pho.gov / Staff@123</p>
        </div>
      </div>
    </div>
  )
}
