import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

Deno.serve(async (request) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
      return new Response('Server configuration incomplete', { status: 500 });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    const signature = request.headers.get('stripe-signature');
    if (!signature) return new Response('Missing signature', { status: 400 });
    const event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
    );
    const supabase = createClient(supabaseUrl, serviceKey);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.['order_id'];
      if (orderId) {
        await supabase.from('orders').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', orderId).eq('status', 'pending_payment');
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.['order_id'];
      if (orderId) {
        await supabase.from('orders').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('id', orderId).eq('status', 'pending_payment');
      }
    }
    return new Response('ok');
  } catch (error) {
    console.error(error);
    return new Response('Invalid webhook', { status: 400 });
  }
});
