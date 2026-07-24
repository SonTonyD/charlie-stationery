export type DeliveryMethodId =
  | 'mondial_relay_pickup'
  | 'laposte_pickup'
  | 'mondial_relay_home'
  | 'laposte_home';

export interface DeliveryDetails {
  method: DeliveryMethodId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  relayPoint?: Record<string, unknown>;
}

export const DELIVERY_METHODS = [
  {
    id: 'mondial_relay_pickup',
    carrier: 'Mondial Relay',
    mode: 'Point relais',
    price: 4.9,
    network: 'MONR_NETWORK',
  },
  {
    id: 'laposte_pickup',
    carrier: 'La Poste',
    mode: 'Point relais',
    price: 4.9,
    network: 'POFR_UP_TO_30_KG_NETWORK',
  },
  { id: 'mondial_relay_home', carrier: 'Mondial Relay', mode: 'À domicile', price: 7.9 },
  { id: 'laposte_home', carrier: 'La Poste', mode: 'À domicile', price: 7.9 },
] as const;
