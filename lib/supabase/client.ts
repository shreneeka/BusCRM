import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL||'https://vdgqngppsaoagsojdbdb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_dq6rv_j7e_HiI4qwX7fZyg_6l2cpwcI'
  )
}