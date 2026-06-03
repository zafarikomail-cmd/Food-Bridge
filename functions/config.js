// ══════════════════════════════════════════════
// Cloudflare Pages Function — /config
// Serves Supabase credentials from environment
// variables so they never appear in client code.
//
// Set these in Cloudflare Dashboard:
//   Pages → your project → Settings → Environment Variables
//   SUPABASE_URL  = https://xxxx.supabase.co
//   SUPABASE_KEY  = eyJhbGci...  (anon/public key)
// ══════════════════════════════════════════════

export async function onRequest(context) {
  const { SUPABASE_URL, SUPABASE_KEY } = context.env;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server configuration missing.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ url: SUPABASE_URL, key: SUPABASE_KEY }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Only this origin can read the response
        'Cache-Control': 'no-store',
      },
    }
  );
}
