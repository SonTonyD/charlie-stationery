import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return json({ error: 'Configuration serveur incomplète' }, 500);

    const body = await request.json();
    const firstName = cleanText(body?.firstName, 100);
    const lastName = cleanText(body?.lastName, 100) || null;
    const email = cleanText(body?.email, 254).toLowerCase();
    const comment = cleanText(body?.comment, 500);
    const rating = Math.floor(Number(body?.rating));

    if (!firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !comment || rating < 1 || rating > 5) {
      return json({ error: 'Les informations de l’avis sont invalides.' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: paidOrder, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .ilike('customer_email', email)
      .not('paid_at', 'is', null)
      .limit(1)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!paidOrder) {
      return json({ error: 'Aucune commande payée ne correspond à cette adresse e-mail.' }, 403);
    }

    const { error } = await supabase.from('reviews').insert({
      first_name: firstName,
      last_name: lastName,
      email,
      rating,
      comment,
      is_published: false,
    });
    if (error) throw error;

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ error: 'Impossible d’enregistrer cet avis pour le moment.' }, 500);
  }
});

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
