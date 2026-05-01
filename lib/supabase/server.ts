import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL||'https://vdgqngppsaoagsojdbdb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_dq6rv_j7e_HiI4qwX7fZyg_6l2cpwcI',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            
          }
        },
      },
    },
  );
}
