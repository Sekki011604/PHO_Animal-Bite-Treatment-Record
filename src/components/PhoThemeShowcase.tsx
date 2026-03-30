import React from 'react'
import { ShieldCheck } from 'lucide-react'

const navItems = ['Records', 'New Entry', 'Analytics', 'Reports'] as const

type ButtonVariant = 'primary' | 'secondary'

type ThemeButtonProps = {
  children: React.ReactNode
  variant?: ButtonVariant
}

function ThemeButton({ children, variant = 'primary' }: ThemeButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        className={`${base} border border-primary-phogreen bg-surface-white text-primary-phogreen hover:bg-primary-phogreen/10`}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`${base} bg-primary-phogreen text-surface-white shadow-sm hover:bg-primary-phogreen-dark`}
    >
      {children}
    </button>
  )
}

export default function PhoThemeShowcase() {
  return (
    <section className="mx-auto max-w-5xl space-y-6 bg-surface-cream p-4 md:p-8">
      <header className="rounded-2xl border border-border-lightgreen bg-surface-white text-text-darkgreen shadow-sm">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-xl bg-primary-phogreen p-2 text-surface-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary-phogreen">Provincial Health Office</p>
              <h1 className="mt-1 text-2xl font-semibold">Palawan Digital Health Records</h1>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map(item => (
              <a
                key={item}
                href="#"
                className="rounded-lg border border-transparent px-3 py-2 text-sm text-primary-phogreen transition hover:border-secondary-gold hover:text-text-darkgreen"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <ThemeButton>Save Record</ThemeButton>
        <ThemeButton variant="secondary">View Details</ThemeButton>
      </div>

      <article className="rounded-2xl border border-border-lightgreen bg-surface-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-secondary-gold-dark">Municipality Profile</p>
        <h2 className="mt-2 text-xl font-semibold text-text-darkgreen">Animal Bite Treatment Summary</h2>
        <p className="mt-3 text-sm leading-relaxed text-pho-text-secondary">
          This card demonstrates PHO palette usage with clear text hierarchy, subtle cream border treatment,
          and reusable semantic color tokens from the theme.
        </p>
      </article>
    </section>
  )
}
