import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      const msg = signInError.message.toLowerCase().includes('invalid')
        ? 'Invalid credentials'
        : signInError.message
      setError(msg)
      setLoading(false)
      return
    }

    navigate('/dashboard', { replace: true })
    setLoading(false)
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
              disabled={loading}
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
              disabled={loading}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border-lightgreen bg-white px-3 py-2.5 text-sm text-text-darkgreen outline-none transition focus:ring-2 focus:ring-primary-phogreen/30"
              placeholder="Enter your password"
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-phogreen px-4 py-2.5 text-sm font-semibold text-surface-white transition hover:bg-primary-phogreen-dark"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-secondary-gold/40 bg-surface-cream p-3 text-xs text-pho-text-secondary">
          <p className="font-semibold text-text-darkgreen">Supabase Login</p>
          <p className="mt-1">Use an existing Supabase email and password.</p>
        </div>
      </div>
    </div>
  )
}
