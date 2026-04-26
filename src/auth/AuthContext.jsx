// AuthContext using Supabase auth
import React, { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../config/supabaseClient'
import { signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '../lib/auth'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [backendUser, setBackendUser] = useState(null)
  const [backendLoading, setBackendLoading] = useState(true)
  const [loading, setLoading] = useState(true)

  const loadBackendMe = async () => {
    setBackendLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const token = localStorage.getItem('token')
      if (!token) {
        setBackendUser(null)
        setBackendLoading(false)
        return
      }

      const res = await fetch(`${apiBase}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json().catch(() => null)
      const isSuccess = json?.isSuccess ?? json?.IsSuccess
      if (!res.ok || !isSuccess) {
        setBackendUser(null)
        setBackendLoading(false)
        return
      }

      const id = json?.id ?? json?.Id
      const email = json?.email ?? json?.Email
      const role = json?.role ?? json?.Role
      setBackendUser({ id, email, role })
      setBackendLoading(false)
    } catch {
      setBackendUser(null)
      setBackendLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    // get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      // enrich user with profile data if available
      ;(async () => {
        const u = data.session?.user ?? null
        if (!u) {
          setUser(null)
          setLoading(false)
          return
        }
        try {
          const userId = u.id
          const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          if (profileError) throw profileError
          const merged = {
            ...u,
            profile: profile ?? null,
            firstName: profile?.first_name ?? u.user_metadata?.first_name ?? null,
            lastName: profile?.last_name ?? u.user_metadata?.last_name ?? null,
            fullName: profile?.full_name ?? u.user_metadata?.full_name ?? null,
          }
          setUser(merged)
        } catch (e) {
          setUser(u)
        } finally {
          setLoading(false)
        }
      })()
    })

    // load backend user info if token already exists
    loadBackendMe()

    const onTokenUpdated = () => {
      loadBackendMe()
    }
    try {
      window.addEventListener('tokenUpdated', onTokenUpdated)
    } catch {
      // ignore
    }

    // listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      ;(async () => {
        const u = session?.user ?? null
        if (!u) {
          setUser(null)
          return
        }
        try {
          const userId = u.id
          const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          if (profileError) throw profileError
          const merged = {
            ...u,
            profile: profile ?? null,
            firstName: profile?.first_name ?? u.user_metadata?.first_name ?? null,
            lastName: profile?.last_name ?? u.user_metadata?.last_name ?? null,
            fullName: profile?.full_name ?? u.user_metadata?.full_name ?? null,
          }
          setUser(merged)
        } catch (e) {
          setUser(u)
        }
      })()
    })

    return () => {
      mounted = false
      try {
        authListener?.subscription?.unsubscribe()
      } catch (e) {
        // ignore
      }

      try {
        window.removeEventListener('tokenUpdated', onTokenUpdated)
      } catch {
        // ignore
      }
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    backendLoading,
    setUser,
    backendUser,
    isAdmin:
      backendUser?.role === 'SystemManager' ||
      backendUser?.role === 1 ||
      backendUser?.role === '1',
    // auth actions
    signIn: async (email, password) => {
      const { data, error } = await signInWithEmail(email, password)
      if (error) return { data, error }

      // Important: never keep a stale backend JWT from a previous user.
      // If backend login fails, the app should NOT continue using an old token
      // (which can make an admin look like a student).
      try {
        localStorage.removeItem('token')
      } catch (e) {
        // ignore
      }
      setBackendUser(null)
      try { window.dispatchEvent(new Event('tokenUpdated')) } catch (e) {}
      
      // Also try to login to backend to obtain backend JWT/token
      // Do this BEFORE setting user so token is available when Profile component mounts
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json()
        const isSuccess = json?.isSuccess ?? json?.IsSuccess
        if (res.ok && isSuccess !== false) {
          // backend may return Token
            const token = json?.token ?? json?.Token
            if (token) {
              localStorage.setItem('token', token)
              // notify other parts of the app that token is available
              try { window.dispatchEvent(new Event('tokenUpdated')) } catch(e){}
            }
        } else {
          // Ensure we don't keep any previous token around.
          try { localStorage.removeItem('token') } catch (e) {}
          setBackendUser(null)
          try { window.dispatchEvent(new Event('tokenUpdated')) } catch(e){}
          // backend login failed but supabase session is valid, log it
          console.warn('Backend login failed:', json?.message ?? json?.Message)
        }
      } catch (e) {
        // Ensure we don't keep any previous token around.
        try { localStorage.removeItem('token') } catch (err) {}
        setBackendUser(null)
        try { window.dispatchEvent(new Event('tokenUpdated')) } catch(err){}
        // network/backend error — log but continue
        console.warn('Backend login error:', e.message)
      }
      
      // set user from session if available (AFTER backend login)
      const userFromSession = data?.session?.user ?? null
      // enrich with profile if possible
      if (userFromSession) {
        try {
          const userId = userFromSession.id
          const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          if (profileError) throw profileError
          const merged = {
            ...userFromSession,
            profile: profile ?? null,
            firstName: profile?.first_name ?? userFromSession.user_metadata?.first_name ?? null,
            lastName: profile?.last_name ?? userFromSession.user_metadata?.last_name ?? null,
            fullName: profile?.full_name ?? userFromSession.user_metadata?.full_name ?? null,
          }
          setUser(merged)
        } catch (e) {
          setUser(userFromSession)
        }
      } else {
        setUser(null)
      }

      return { data, error }
    },

    signUp: async (email, password) => {
      const { data, error } = await signUpWithEmail(email, password)
      if (error) return { data, error }
      const userFromSession = data?.user ?? data?.session?.user ?? null
      if (userFromSession) {
        try {
          const userId = userFromSession.id
          const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          if (profileError) throw profileError
          const merged = {
            ...userFromSession,
            profile: profile ?? null,
            firstName: profile?.first_name ?? userFromSession.user_metadata?.first_name ?? null,
            lastName: profile?.last_name ?? userFromSession.user_metadata?.last_name ?? null,
            fullName: profile?.full_name ?? userFromSession.user_metadata?.full_name ?? null,
          }
          setUser(merged)
        } catch (e) {
          setUser(userFromSession)
        }
      } else {
        setUser(null)
      }
      return { data, error }
    },

    // register with profile data and create profiles row + backend user
    register: async (payload) => {
      const { email, password, firstName, lastName, faculty, department, year } = payload
      const { data: authData, error: authError } = await signUpWithEmail(email, password)
      if (authError) return { data: { auth: authData }, error: authError }

      // try to insert/upsert profile if user id available
      const userId = authData?.user?.id ?? authData?.session?.user?.id
      let profileResult = null
      let profileError = null
      if (userId) {
        const profile = {
          id: userId,
          first_name: firstName ?? '',
          last_name: lastName ?? '',
          full_name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
          faculty: faculty ?? null,
          department: department ?? null,
          year: year ?? null,
        }
        // use upsert so we don't fail if a profile row already exists for this user
        const { data: pData, error: pError } = await supabase
          .from('profiles')
          .upsert([profile], { onConflict: 'id' })
        profileResult = pData
        profileError = pError
      }

      // Also create corresponding backend user and get JWT token
      let backendToken = null
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        // Map class level from `year` string to backend enum names
        const mapClassLevel = (yr) => {
          if (!yr) return null
          const y = yr.toString().toLowerCase()
          if (y.includes('hazir')) return 'Hazirlik'
          if (y === '1') return 'BirinciSinif'
          if (y === '2') return 'IkinciSinif'
          if (y === '3') return 'UcuncuSinif'
          if (y === '4') return 'DorduncuSinif'
          if (y.includes('lisans') || y.includes('mezun')) return 'Mezun'
          return null
        }

        const registerPayload = {
          name: firstName ?? '',
          surname: lastName ?? '',
          email,
          password,
          faculty: faculty ?? null,
          department: department ?? null,
          classLevel: mapClassLevel(year),
        }

        const res = await fetch(`${apiBase}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerPayload),
        })
        const json = await res.json()
        if (!res.ok || json?.isSuccess === false) {
          // return backend error combined
          return { data: { auth: authData, profile: profileResult, backend: json }, error: json }
        }
        
        // Now login to backend to get JWT token
        try {
          const loginRes = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const loginJson = await loginRes.json()
          if (loginRes.ok && loginJson?.isSuccess !== false && loginJson?.token) {
            backendToken = loginJson.token
            localStorage.setItem('token', backendToken)
            try { window.dispatchEvent(new Event('tokenUpdated')) } catch(e){}
          }
        } catch (loginE) {
          console.warn('Backend login after register failed:', loginE.message)
        }
      } catch (e) {
        // network/backend error — include warning in result but do not rollback supabase
        return { data: { auth: authData, profile: profileResult }, error: e }
      }

      // set user if session present (and enrich with profile)
      const userFromSession = authData?.user ?? authData?.session?.user ?? null
      if (userFromSession) {
        try {
          const userId = userFromSession.id
          const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          if (profileError) throw profileError
          const merged = {
            ...userFromSession,
            profile: profile ?? null,
            firstName: profile?.first_name ?? userFromSession.user_metadata?.first_name ?? null,
            lastName: profile?.last_name ?? userFromSession.user_metadata?.last_name ?? null,
            fullName: profile?.full_name ?? userFromSession.user_metadata?.full_name ?? null,
          }
          setUser(merged)
        } catch (e) {
          setUser(userFromSession)
        }
      } else {
        setUser(null)
      }

      return { data: { auth: authData, profile: profileResult }, error: profileError || authError }
    },

    signOut: async () => {
      const { error } = await supabaseSignOut()
      // Remove backend token from localStorage so frontend no longer sends it
      try {
        localStorage.removeItem('token')
      } catch (e) {
        // ignore
      }
      setBackendUser(null)
      if (!error) setUser(null)
      return { error }
    },
  }

  // Backwards-compatible aliases for existing code
  value.logout = value.signOut
  value.login = value.signIn
  value.signUp = value.signUp

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export default AuthProvider
