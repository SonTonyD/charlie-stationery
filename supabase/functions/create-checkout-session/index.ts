import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const siteUrl = resolveSiteUrl(request);

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

    const boxIds = [...new Set(checkoutItems.map((item) => item.boxId))];

    const { data: boxes, error } = await supabase
      .from('boxes')
      .select(
        'id, name, description, image_url, show_on_front_office, sale_price, weight_grams, stock_quantity, has_variants, box_images(image_url, sort_order), box_variants(id, name, price)',
      )
      .in('id', boxIds);

    if (error) {
      throw error;
    }

    if (!boxes || boxes.length !== boxIds.length) {
      return jsonResponse({ error: 'One or more boxes are not available' }, 404);
    }

    let itemsTotalCents = 0;
    let totalWeightGrams = 0;
    const orderItems: Record<string, unknown>[] = [];
    const boxesById = new Map(boxes.map((box) => [box.id, box]));
    const requestedQuantityByBoxId = new Map<string, number>();
    for (const item of checkoutItems) {
      requestedQuantityByBoxId.set(
        item.boxId,
        (requestedQuantityByBoxId.get(item.boxId) ?? 0) + item.quantity,
      );
    }
    for (const box of boxes) {
      const requestedQuantity = requestedQuantityByBoxId.get(box.id) ?? 0;
      const stockQuantity = Math.max(
        0,
        Math.floor(Number(box.stock_quantity) || 0),
      );
      if (requestedQuantity > stockQuantity) {
        throw new CheckoutValidationError(
          `Stock insuffisant pour ${box.name} (${stockQuantity} disponible${stockQuantity > 1 ? 's' : ''})`,
          409,
        );
      }
    }
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = checkoutItems.map((item) => {
      const box = boxesById.get(item.boxId);
      if (!box) throw new CheckoutValidationError('Box not available', 404);
      if (!box.show_on_front_office) {
        throw new CheckoutValidationError('Box not available', 404);
      }

      const variant = item.variantId
        ? (box.box_variants ?? []).find((entry) => entry.id === item.variantId)
        : null;
      if (box.has_variants && !variant) {
        throw new CheckoutValidationError('Une variante valide doit être sélectionnée', 400);
      }
      if (!box.has_variants && item.variantId) {
        throw new CheckoutValidationError('Cette box ne possède pas de variante', 400);
      }
      const price = Number(variant?.price ?? box.sale_price ?? 0);
      const unitAmount = Math.round(price * 100);

      if (unitAmount <= 0) {
        throw new CheckoutValidationError('Box price is invalid', 400);
      }
      const quantity = item.quantity;
      itemsTotalCents += unitAmount * quantity;
      totalWeightGrams += Math.max(1, Math.floor(Number(box.weight_grams) || 0)) * quantity;
      orderItems.push({
        boxId: box.id,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        name: box.name,
        unitPrice: price,
        quantity,
      });

      const primaryImage =
        [...(box.box_images ?? [])].sort(
          (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
        )[0]?.image_url || box.image_url;

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: variant ? `${box.name} — ${variant.name}` : box.name,
            description: stripeDescription(box.description),
            images: primaryImage?.startsWith('http') ? [primaryImage] : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity,
      };
    });

    const { data: shippingRate, error: shippingRateError } = await supabase
      .from('shipping_rates')
      .select('price')
      .eq('carrier', delivery.rateCarrier)
      .eq('delivery_mode', delivery.mode)
      .lte('weight_min_grams', totalWeightGrams)
      .gte('weight_max_grams', totalWeightGrams)
      .maybeSingle();
    if (shippingRateError) throw shippingRateError;
    if (!shippingRate) {
      throw new CheckoutValidationError(
        'Aucun tarif de livraison ne couvre le poids de cette commande',
        400,
      );
    }
    const deliveryPriceCents = Math.round(Number(shippingRate.price) * 100);

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: `Livraison — ${delivery.carrier} (${delivery.modeLabel})` },
        unit_amount: deliveryPriceCents,
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
      delivery_price: deliveryPriceCents / 100,
      delivery_address: delivery.address,
      delivery_postal_code: delivery.postalCode,
      delivery_city: delivery.city,
      relay_point: delivery.relayPoint,
      items: orderItems,
      items_total: itemsTotalCents / 100,
      total_weight_grams: totalWeightGrams,
      total: (itemsTotalCents + deliveryPriceCents) / 100,
    }).select('id').single();
    if (orderError || !order) throw orderError ?? new Error('Unable to create order');

    const metadata: Record<string, string> = {
      box_ids: checkoutItems.map((item) => item.boxId).join(','),
      quantities: checkoutItems.map((item) => String(item.quantity)).join(','),
      variant_ids: checkoutItems.map((item) => item.variantId ?? '').join(','),
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

    console.error('create-checkout-session failed', error);
    return jsonResponse(
      {
        error: 'Unable to create checkout session',
        errorCode: checkoutErrorCode(error),
      },
      500,
    );
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

  const quantityByItemKey = new Map<
    string,
    { boxId: string; variantId?: string; quantity: number }
  >();

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
    const variantId =
      'variantId' in item && typeof item.variantId === 'string' && item.variantId.trim()
        ? item.variantId.trim()
        : undefined;
    const quantity =
      'quantity' in item ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : 1;

    if (!boxId) {
      continue;
    }

    const key = `${boxId}:${variantId ?? 'default'}`;
    const existing = quantityByItemKey.get(key);
    quantityByItemKey.set(key, {
      boxId,
      variantId,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }

  return [...quantityByItemKey.values()];
}

const deliveryMethods = {
  mondial_relay_pickup: { carrier: 'Mondial Relay', rateCarrier: 'mondial_relay', mode: 'pickup', modeLabel: 'point relais' },
  laposte_pickup: { carrier: 'La Poste', rateCarrier: 'laposte', mode: 'pickup', modeLabel: 'point relais' },
  mondial_relay_home: { carrier: 'Mondial Relay', rateCarrier: 'mondial_relay', mode: 'home', modeLabel: 'à domicile' },
  laposte_home: { carrier: 'La Poste', rateCarrier: 'laposte', mode: 'home', modeLabel: 'à domicile' },
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

function stripeDescription(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const description = value.trim();
  return description ? description.slice(0, 500) : undefined;
}

function checkoutErrorCode(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'type' in error &&
    typeof error.type === 'string' &&
    ('statusCode' in error || 'requestId' in error)
  ) {
    return 'stripe_error';
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return `database_${error.code}`;
  }
  return 'internal_error';
}

function resolveSiteUrl(request: Request) {
  const candidates = [
    Deno.env.get('SITE_URL'),
    request.headers.get('origin'),
    'http://localhost:4200',
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' || url.hostname === 'localhost') {
        return url.origin;
      }
    } catch {
      // Essaie la valeur suivante si le secret ou l'origine est invalide.
    }
  }
  return 'http://localhost:4200';
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
