import supabase from '../config/supabaseClient'

// Email + password register
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

// Email + password sign-in
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Magic link (OTP) via email
export async function sendMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({ email })
  return { data, error }
}

// OAuth provider (google, github, etc.)
export async function signInWithProvider(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider })
  return { data, error }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Get current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { data, error }
}

// Listen to auth state changes; returns subscription so caller can unsubscribe
export function onAuthStateChanged(callback) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return subscription
}

// Send reset password email
export async function resetPassword(email, redirectTo) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  return { data, error }
}
