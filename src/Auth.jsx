import React, { useState } from 'react'
import toast from 'react-hot-toast'
import api from './api'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ username: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Fill all required fields')
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.post('/auth/register', {
          username: form.username,
          password: form.password,
          full_name: form.full_name,
        })
        toast.success('Account created — please log in')
        setMode('login')
      } else {
        const params = new URLSearchParams()
        params.append('username', form.username)
        params.append('password', form.password)
        const { data } = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        localStorage.setItem('ss_token', data.access_token)
        localStorage.setItem('ss_user', JSON.stringify(data.user))
        onAuth(data.user)
        toast.success(`Welcome back, ${data.user.username}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
                        bg-gold-400/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md fade-in relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ink-950">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-gold-400 font-display font-semibold text-lg tracking-wide">
              SHREYA SYSTEMS
            </span>
          </div>
          <h1 className="font-display text-3xl text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-500 text-sm">
            {mode === 'login'
              ? 'Sign in to your quotation studio'
              : 'Start generating professional quotations'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handle}
                  placeholder="Your name"
                  className="input-field"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Username <span className="text-gold-400">*</span>
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handle}
                placeholder="e.g. shreya_admin"
                className="input-field"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Password <span className="text-gold-400">*</span>
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                className="input-field"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-ink-950/30 border-t-ink-950
                                     rounded-full animate-spin inline-block" />
                    {mode === 'login' ? 'Signing in…' : 'Creating…'}
                  </span>
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <div className="gold-rule mt-6 pt-6 text-center">
            <span className="text-gray-500 text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Shreya Systems · Pune · GSTIN 27AFFPG6521C1ZW
        </p>
      </div>
    </div>
  )
}
