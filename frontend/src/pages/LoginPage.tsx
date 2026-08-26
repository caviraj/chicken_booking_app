import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Header } from '../components/Header'
import { ChevronDown, Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Check } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signInWithGoogle, user } = useAuth()

  // Form tab: 'signin' | 'signup' | 'forgot'
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

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
    const isPasswordRecovery = sessionStorage.getItem('is_password_recovery') === 'true'
    if (
      isPasswordRecovery ||
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('code=')
    ) {
      navigate('/reset-password')
      return
    }
    if (user) {
      navigate('/booking')
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

    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000)
      setErrorMsg(`${t('auth.rateLimited') || 'Too many attempts. Wait'} (${remainingSeconds}s)`)
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (tab === 'forgot') {
        const redirectTarget = window.location.origin.includes('localhost')
          ? 'https://chicken-booking-app.vercel.app/reset-password'
          : `${window.location.origin}/reset-password`

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTarget
        })
        if (error) {
          setErrorMsg(error.message)
        } else {
          setSuccessMsg(
            t('auth.resetEmailSent') ||
              'Password reset link sent to your email! Please check your inbox / spam folder.'
          )
        }
      } else if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          const newAttempts = failedAttempts + 1
          setFailedAttempts(newAttempts)
          if (newAttempts >= 4) {
            setLockoutTime(Date.now() + 60000)
            setErrorMsg(t('auth.rateLimited') || 'Too many attempts. Please try again in 60 seconds.')
          } else {
            setErrorMsg(t('auth.invalidCredentials') || 'Invalid email or password')
          }
        } else {
          setFailedAttempts(0)
          navigate('/booking')
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/booking`,
            data: {
              full_name: fullName,
              phone_number: phoneNumber
            }
          }
        })

        if (error) {
          setErrorMsg(error.message)
        } else if (data.user && !data.session) {
          setSuccessMsg(t('auth.verifyEmailNotice') || 'Please check your email to verify your account.')
        } else {
          navigate('/booking')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left Hero side */}
          <div className="hidden md:flex flex-col space-y-6 p-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold w-max border border-red-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('auth.heroBadge') || 'Premium Meat Experience'}</span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {t('auth.heroTitle') || 'Freshly Cut Quality Meat Delivered To Your Doorstep'}
            </h1>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('auth.heroSubtitle') || 'Order farm-fresh Chicken, Mutton, and Duck cut to your exact preference with automated doorstep delivery.'}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span>{t('auth.heroPoint1') || 'Hygienically Processed Daily'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span>{t('auth.heroPoint2') || 'Select Your Custom Cutting Style'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span>{t('auth.heroPoint3') || 'Instant Payment Links & COD Support'}</span>
              </div>
            </div>

            {/* Dedicated Admin Portal Link Card in Hero Side */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900">{t('auth.adminAccess') || 'Admin Portal Access'}</h4>
                  <p className="text-[11px] text-amber-700 font-medium">{t('auth.adminAccessSubtitle') || 'Manage rates & orders'}</p>
                </div>
              </div>
              <Link
                to="/admin/rates"
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                {t('auth.openAdminPortal') || 'Admin Portal'}
              </Link>
            </div>
          </div>

          {/* Right Card side */}
          <div className="pro-card p-6 sm:p-8 relative overflow-hidden">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t('auth.welcomeTitle') || 'Welcome to FreshMeat'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('auth.welcomeSubtitle') || 'Sign in to place your custom fresh meat order'}
              </p>
            </div>

            {/* Status alerts */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Primary Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{t('auth.googleSignIn') || 'Sign in with Google'}</span>
            </button>

            {/* Divider / Expandable toggle */}
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative bg-white text-[11px] text-slate-500 font-bold px-3 py-0.5 rounded-full border border-slate-200 hover:text-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('auth.orContinueWithEmail') || 'Or continue with email'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-red-800' : ''}`} />
              </button>
            </div>

            {/* Expandable Email Auth Section */}
            {isExpanded && (
              <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Tabs */}
                {tab !== 'forgot' ? (
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                    <button
                      type="button"
                      onClick={() => { setTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${tab === 'signin' ? 'bg-red-800 text-white shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      {t('auth.signInTab') || 'Sign In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${tab === 'signup' ? 'bg-red-800 text-white shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      {t('auth.signUpTab') || 'Register'}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <h3 className="text-xs font-extrabold text-amber-900">{t('auth.resetPasswordTitle') || 'Reset Password'}</h3>
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5">{t('auth.resetPasswordSubtitle') || 'Enter your registered email to receive reset link'}</p>
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {tab === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {t('auth.fullNameLabel') || 'Full Name'}
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none z-10" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={t('auth.fullNamePlaceholder') || 'Enter your name'}
                            className="w-full pro-input pro-input-has-icon text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {t('auth.phoneNumberLabel') || 'Phone Number'}
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none z-10" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder={t('auth.phoneNumberPlaceholder') || '+91 9876543210'}
                            className="w-full pro-input pro-input-has-icon text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('auth.emailLabel') || 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none z-10" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder') || 'you@example.com'}
                        className="w-full pro-input pro-input-has-icon text-xs"
                      />
                    </div>
                  </div>

                  {tab !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          {t('auth.passwordLabel') || 'Password'}
                        </label>
                        {tab === 'signin' && (
                          <button
                            type="button"
                            onClick={() => { setTab('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                            className="text-[11px] font-extrabold text-red-800 hover:text-red-900 hover:underline cursor-pointer"
                          >
                            {t('auth.forgotPassword') || 'Forgot Password?'}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none z-10" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('auth.passwordPlaceholder') || '••••••••'}
                          className="w-full pro-input pro-input-has-icon text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl btn-primary text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading
                      ? (t('auth.loading') || 'Processing...')
                      : tab === 'forgot'
                      ? (t('auth.sendResetLink') || 'Send Reset Link')
                      : tab === 'signin'
                      ? (t('auth.signInBtn') || 'Sign In')
                      : (t('auth.signUpBtn') || 'Create Account')}
                  </button>

                  {tab === 'forgot' && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        {t('auth.backToSignIn') || '← Back to Sign In'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Mobile Admin Portal Link */}
            <div className="md:hidden mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">{t('auth.adminAccess') || 'Admin Portal'}</span>
              <Link
                to="/admin/rates"
                className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-all text-xs"
              >
                {t('auth.openAdminPortal') || 'Admin Portal'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('auth.authFooter') || 'Enterprise End-to-End Encrypted Auth powered by Supabase & Razorpay'}</span>
        </p>
      </footer>
    </div>
  )
}

