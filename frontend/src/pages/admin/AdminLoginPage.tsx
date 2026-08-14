import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { verifyAdminUser } from '../../api/adminApi'
import { Header } from '../../components/Header'
import { ShieldAlert, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react'

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user && data.user.email) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-red-800 selection:text-white">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="pro-card p-6 sm:p-8 relative overflow-hidden shadow-lg border-2 border-slate-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Portal Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">Restricted access for Meat Shop Operations Management</p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@meatshop.com"
                    className="w-full pro-input pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pro-input pl-9 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Admin Console'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Restricted Admin Portal Protected by Row Level Security</span>
        </p>
      </footer>
    </div>
  )
}
