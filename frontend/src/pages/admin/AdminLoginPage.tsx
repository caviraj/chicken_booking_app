import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { verifyAdminUser } from '../../api/adminApi'
import { Header } from '../../components/Header'
import { ShieldAlert, Lock, Mail, AlertCircle, KeyRound } from 'lucide-react'

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  React.useEffect(() => {
    if (user && user.email) {
      verifyAdminUser(user.email).then((isAdmin) => {
        if (isAdmin) {
          navigate('/admin/rates')
        }
      })
    }
  }, [user, navigate])

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Authenticate via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user && data.user.email) {
        // 2. Verify admin permissions
        const isAdmin = await verifyAdminUser(data.user.email)
        if (!isAdmin) {
          await supabase.auth.signOut()
          throw new Error('Access denied. This account is not registered as an administrator.')
        }
        navigate('/admin/rates')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Admin authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Admin Portal Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">Restricted access for Meat Shop Administrators</p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@meatshop.com"
                    className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p className="flex items-center justify-center gap-1.5">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Admin Access Controlled by admin_users Table RLS</span>
        </p>
      </footer>
    </div>
  )
}
