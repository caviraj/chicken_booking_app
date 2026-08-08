import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { verifyAdminUser } from '../api/adminApi'

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState<boolean>(true)

  useEffect(() => {
    if (!authLoading) {
      if (user && user.email) {
        verifyAdminUser(user.email).then((res) => {
          setIsAdmin(res)
          setChecking(false)
        })
      } else {
        setIsAdmin(false)
        setChecking(false)
      }
    }
  }, [user, authLoading])

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400 font-medium">Verifying admin credentials...</span>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
