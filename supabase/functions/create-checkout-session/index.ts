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
    const body = await request.json();

    if (!hasAcceptedLegalDocuments(body)) {
      return jsonResponse({ error: 'Legal documents must be accepted' }, 400);
    }

    const checkoutItems = normalizeCheckoutItems(body);
    const delivery = normalizeDelivery(body);

    if (checkoutItems.length === 0) {
      return jsonResponse({ error: 'At least one checkout item is required' }, 400);
    }
    if (!delivery) {
      return jsonResponse({ error: 'Les informations de livraison sont incomplètes' }, 400);
    }

    const boxIds = checkoutItems.map((item) => item.boxId);
    const quantityByBoxId = new Map(
      checkoutItems.map((item) => [item.boxId, item.quantity]),
    );

    const { data: boxes, error } = await supabase
      .from('boxes')
      .select(
        'id, name, description, image_url, show_on_front_office, sale_price, box_images(image_url, sort_order)',
      )
      .in('id', boxIds);

    if (error) {
      throw error;
    }

    if (!boxes || boxes.length !== checkoutItems.length) {
      return jsonResponse({ error: 'One or more boxes are not available' }, 404);
    }

    let itemsTotalCents = 0;
    const orderItems: Record<string, unknown>[] = [];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = boxes.map((box) => {
      if (!box.show_on_front_office) {
        throw new CheckoutValidationError('Box not available', 404);
      }

      const price = Number(box.sale_price ?? 0);
      const unitAmount = Math.round(price * 100);

      if (unitAmount <= 0) {
        throw new CheckoutValidationError('Box price is invalid', 400);
      }
      const quantity = quantityByBoxId.get(box.id) ?? 1;
      itemsTotalCents += unitAmount * quantity;
      orderItems.push({ boxId: box.id, name: box.name, unitPrice: price, quantity });

      const primaryImage =
        [...(box.box_images ?? [])].sort(
          (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
        )[0]?.image_url || box.image_url;

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: box.name,
            description: box.description || undefined,
            images: primaryImage?.startsWith('http') ? [primaryImage] : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity,
      };
    });

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: `Livraison — ${delivery.carrier} (${delivery.modeLabel})` },
        unit_amount: delivery.priceCents,
      },
      quantity: 1,
    });

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      status: 'pending_payment',
      customer_first_name: delivery.firstName,
      customer_last_name: delivery.lastName,
      customer_email: delivery.email,
      customer_phone: delivery.phone,
      delivery_method: delivery.method,
      delivery_carrier: delivery.carrier,
      delivery_mode: delivery.mode,
      delivery_price: delivery.priceCents / 100,
      delivery_address: delivery.address,
      delivery_postal_code: delivery.postalCode,
      delivery_city: delivery.city,
      relay_point: delivery.relayPoint,
      items: orderItems,
      items_total: itemsTotalCents / 100,
      total: (itemsTotalCents + delivery.priceCents) / 100,
    }).select('id').single();
    if (orderError || !order) throw orderError ?? new Error('Unable to create order');

    const metadata: Record<string, string> = {
      box_ids: checkoutItems.map((item) => item.boxId).join(','),
      quantities: checkoutItems.map((item) => String(item.quantity)).join(','),
      legal_accepted: 'true',
      legal_accepted_at: new Date().toISOString(),
      legal_documents: 'cgv,cgu,politique-confidentialite,mentions-legales',
      order_id: order.id,
      delivery_method: delivery.method,
    };

    if (checkoutItems.length === 1) {
      metadata.box_id = checkoutItems[0].boxId;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      metadata,
      customer_email: delivery.email,
    });

    const { error: sessionUpdateError } = await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);
    if (sessionUpdateError) throw sessionUpdateError;

    return jsonResponse({ url: session.url });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    console.error(error);
    return jsonResponse({ error: 'Unable to create checkout session' }, 500);
  }
});

function normalizeCheckoutItems(body: unknown) {
  if (!body || typeof body !== 'object') {
    return [];
  }

  if (
    'boxId' in body &&
    typeof body.boxId === 'string' &&
    body.boxId.trim()
  ) {
    return [{ boxId: body.boxId.trim(), quantity: 1 }];
  }

  if (!('items' in body) || !Array.isArray(body.items)) {
    return [];
  }

  const quantityByBoxId = new Map<string, number>();

  for (const item of body.items) {
    if (
      !item ||
      typeof item !== 'object' ||
      !('boxId' in item) ||
      typeof item.boxId !== 'string'
    ) {
      continue;
    }

    const boxId = item.boxId.trim();
    const quantity =
      'quantity' in item ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : 1;

    if (!boxId) {
      continue;
    }

    quantityByBoxId.set(boxId, (quantityByBoxId.get(boxId) ?? 0) + quantity);
  }

  return [...quantityByBoxId.entries()].map(([boxId, quantity]) => ({
    boxId,
    quantity,
  }));
}

const deliveryMethods = {
  mondial_relay_pickup: { carrier: 'Mondial Relay', mode: 'pickup', modeLabel: 'point relais', priceCents: 490 },
  laposte_pickup: { carrier: 'La Poste', mode: 'pickup', modeLabel: 'point relais', priceCents: 490 },
  mondial_relay_home: { carrier: 'Mondial Relay', mode: 'home', modeLabel: 'à domicile', priceCents: 790 },
  laposte_home: { carrier: 'La Poste', mode: 'home', modeLabel: 'à domicile', priceCents: 790 },
} as const;

function normalizeDelivery(body: unknown) {
  if (!body || typeof body !== 'object' || !('delivery' in body) || !body.delivery || typeof body.delivery !== 'object') return null;
  const value = body.delivery as Record<string, unknown>;
  const method = typeof value['method'] === 'string' ? value['method'] : '';
  if (!(method in deliveryMethods)) return null;
  const config = deliveryMethods[method as keyof typeof deliveryMethods];
  const firstName = text(value['firstName']);
  const lastName = text(value['lastName']);
  const email = text(value['email']).toLowerCase();
  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const phone = text(value['phone']) || null;
  const address = text(value['address']) || null;
  const postalCode = text(value['postalCode']) || null;
  const city = text(value['city']) || null;
  const relayPoint = value['relayPoint'] && typeof value['relayPoint'] === 'object' ? value['relayPoint'] : null;
  if (config.mode === 'pickup' && (!relayPoint || !postalCode || !city)) return null;
  if (config.mode === 'home' && (!phone || !address || !postalCode || !/^\d{5}$/.test(postalCode) || !city)) return null;
  return { method, ...config, firstName, lastName, email, phone, address, postalCode, city, relayPoint };
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 300) : '';
}

function hasAcceptedLegalDocuments(body: unknown) {
  return (
    !!body &&
    typeof body === 'object' &&
    'legalAccepted' in body &&
    body.legalAccepted === true
  );
}

class CheckoutValidationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
