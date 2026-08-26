import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { supabase } from '../lib/supabaseClient'
import { Lock, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react'

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch') || 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg(t('auth.passwordUpdated') || 'Password updated successfully!')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="pro-card p-6 sm:p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <KeyRound className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            {t('auth.updatePassword') || 'Update New Password'}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter your new secure password below to complete account recovery.
          </p>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs font-medium text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-medium text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('auth.newPasswordLabel') || 'New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pro-input pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('auth.confirmNewPasswordLabel') || 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pro-input pl-9 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl btn-primary text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (t('auth.loading') || 'Processing...') : (t('auth.updatePassword') || 'Update Password')}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured Password Reset powered by Supabase Auth</span>
        </p>
      </footer>
    </div>
  )
}
