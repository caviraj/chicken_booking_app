import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Header } from '../components/Header'
import { ChevronDown, Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signInWithGoogle, user } = useAuth()

  // Form tab: 'signin' | 'signup'
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Form states
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Rate limiting tracker
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      await signInWithGoogle()
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check rate limit lockout (max 5 failed attempts within session)
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000)
      setErrorMsg(`${t('auth.rateLimited')} (${remainingSeconds}s)`)
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          const newAttempts = failedAttempts + 1
          setFailedAttempts(newAttempts)
          if (newAttempts >= 4) {
            setLockoutTime(Date.now() + 60000) // 60s lockout
            setErrorMsg(t('auth.rateLimited'))
          } else {
            setErrorMsg(t('auth.invalidCredentials'))
          }
        } else {
          setFailedAttempts(0)
          navigate('/dashboard')
        }
      } else {
        // Registration flow with email verification
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber
            }
          }
        })

        if (error) {
          setErrorMsg(error.message)
        } else if (data.user && !data.session) {
          setSuccessMsg(t('auth.verifyEmailNotice'))
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card container */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top subtle glow accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                {t('auth.welcomeTitle')}
              </h2>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                {t('auth.welcomeSubtitle')}
              </p>
            </div>

            {/* Status alerts */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Primary Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('auth.googleSignIn')}</span>
            </button>

            {/* Divider / Expandable toggle */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative bg-slate-900/90 text-xs text-slate-400 font-medium px-3 py-1 rounded-full border border-slate-800 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
              >
                <span>{t('auth.orContinueWithEmail')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-orange-400' : ''}`} />
              </button>
            </div>

            {/* Expandable Email Auth Section */}
            {isExpanded && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Tabs: Sign In vs Register */}
                <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs font-semibold text-slate-400">
                  <button
                    type="button"
                    onClick={() => { setTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                    className={`py-2 rounded-lg transition-all ${tab === 'signin' ? 'bg-orange-500 text-white shadow-md' : 'hover:text-slate-200'}`}
                  >
                    {t('auth.signInTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                    className={`py-2 rounded-lg transition-all ${tab === 'signup' ? 'bg-orange-500 text-white shadow-md' : 'hover:text-slate-200'}`}
                  >
                    {t('auth.signUpTab')}
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3.5">
                  {tab === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {t('auth.fullNameLabel')}
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={t('auth.fullNamePlaceholder')}
                            className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {t('auth.phoneNumberLabel')}
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder={t('auth.phoneNumberPlaceholder')}
                            className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('auth.emailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t('auth.passwordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? t('auth.loading') : tab === 'signin' ? t('auth.signInBtn') : t('auth.signUpBtn')}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>Secured by Supabase Auth with Row Level Security</span>
        </p>
      </footer>
    </div>
  )
}
