
import { createClient } from '@supabase/supabase-js'

// Vite exposes env vars via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Safe storage wrapper: some contexts (workers, restricted iframes) disallow
// direct access to localStorage; guard against exceptions to avoid crashes.
const safeStorage = (() => {
	try {
		if (typeof window === 'undefined' || !window?.localStorage) return undefined
		const testKey = '__supabase_storage_test__'
		window.localStorage.setItem(testKey, testKey)
		window.localStorage.removeItem(testKey)
		return window.localStorage
	} catch (e) {
		// Provide a no-op storage to satisfy the client API without throwing
		return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
		}
	}
})()

const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		// pass the storage implementation (or undefined) so client won't throw
		storage: safeStorage,
		// keep session persisted when possible
		persistSession: !!safeStorage,
	},
})

export default supabase