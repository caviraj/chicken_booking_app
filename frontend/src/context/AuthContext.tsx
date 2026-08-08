import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import i18n from '../i18n/config'

export interface CustomerProfile {
  id: string
  auth_user_id: string
  email: string | null
  phone_number: string | null
  full_name: string | null
  preferred_language: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  customer: CustomerProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateLanguage: (lang: 'en' | 'ta') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const syncCustomerProfile = async (authUser: User) => {
    try {
      // 1. Fetch existing customer record by auth_user_id
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching customer profile:', fetchError)
      }

      if (existingCustomer) {
        setCustomer(existingCustomer as CustomerProfile)
        if (existingCustomer.preferred_language) {
          i18n.changeLanguage(existingCustomer.preferred_language)
          localStorage.setItem('preferred_language', existingCustomer.preferred_language)
        }
        return
      }

      // 2. If no record exists, create a new row in customers table
      const newCustomerPayload = {
        auth_user_id: authUser.id,
        email: authUser.email || null,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        phone_number: authUser.phone || null,
        preferred_language: i18n.language || 'en'
      }

      const { data: createdCustomer, error: createError } = await supabase
        .from('customers')
        .insert(newCustomerPayload)
        .select()
        .single()

      if (createError) {
        console.error('Error creating customer profile:', createError)
      } else if (createdCustomer) {
        setCustomer(createdCustomer as CustomerProfile)
      }
    } catch (err) {
      console.error('Customer sync exception:', err)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        syncCustomerProfile(session.user)
      }
      setLoading(false)
    })

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await syncCustomerProfile(session.user)
      } else {
        setCustomer(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setCustomer(null)
    setUser(null)
    setSession(null)
  }

  const updateLanguage = async (lang: 'en' | 'ta') => {
    i18n.changeLanguage(lang)
    localStorage.setItem('preferred_language', lang)
    if (customer && user) {
      setCustomer((prev) => prev ? { ...prev, preferred_language: lang } : null)
      await supabase
        .from('customers')
        .update({ preferred_language: lang })
        .eq('auth_user_id', user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        customer,
        loading,
        signInWithGoogle,
        signOut,
        updateLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
