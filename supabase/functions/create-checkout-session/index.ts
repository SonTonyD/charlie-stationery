import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:4200';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY is not configured' }, 500);
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Supabase server secrets are not configured' }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { boxId } = await request.json();

    if (!boxId || typeof boxId !== 'string') {
      return jsonResponse({ error: 'boxId is required' }, 400);
    }

    const { data: box, error } = await supabase
      .from('boxes')
      .select(
        'id, name, description, image_url, show_on_front_office, box_items(quantity, sale_price)',
      )
      .eq('id', boxId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!box || !box.show_on_front_office) {
      return jsonResponse({ error: 'Box not available' }, 404);
    }

    const price = (box.box_items ?? []).reduce(
      (sum, item) => sum + Number(item.sale_price ?? 0) * Number(item.quantity ?? 0),
      0,
    );
    const unitAmount = Math.round(price * 100);

    if (unitAmount <= 0) {
      return jsonResponse({ error: 'Box price is invalid' }, 400);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: box.name,
              description: box.description || undefined,
              images: box.image_url?.startsWith('http') ? [box.image_url] : undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      metadata: {
        box_id: box.id,
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Unable to create checkout session' }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
