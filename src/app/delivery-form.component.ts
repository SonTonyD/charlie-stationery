import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartItem } from './cart.service';
import { DELIVERY_METHODS, DeliveryMethodId } from './delivery.models';
import { supabase } from './supabase/supabase.client';

declare global {
  interface Window {
    BoxtalParcelPointMap?: {
      BoxtalParcelPointMap: new (options: Record<string, unknown>) => BoxtalMap;
    };
  }
}

interface BoxtalMap {
  searchParcelPoints(address: Record<string, string>, callback: (point: Record<string, unknown>) => void): void;
  updateConfig(config: Record<string, unknown>): void;
}

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-form.component.html',
  styleUrl: './delivery-form.component.css',
})
export class DeliveryFormComponent implements AfterViewInit, OnChanges, OnInit {
  @Input({ required: true }) items: CartItem[] = [];
  @Input() itemsTotal = 0;
  @Input() legalAccepted = false;
  @Output() checkoutStarted = new EventEmitter<void>();
  @Output() checkoutFinished = new EventEmitter<void>();

  readonly methods = DELIVERY_METHODS;
  selectedMethodId: DeliveryMethodId = 'mondial_relay_pickup';
  form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
  };
  relayPoint: Record<string, unknown> | null = null;
  mapMessage = '';
  errorMessage = '';
  isCheckingOut = false;
  isMapLoading = false;
  shippingPrice: number | null = null;
  private shippingRates: {
    carrier: string; delivery_mode: string; weight_min_grams: number;
    weight_max_grams: number; price: number;
  }[] = [];
  private map: BoxtalMap | null = null;
  private viewReady = false;

  get selectedMethod() {
    return this.methods.find((method) => method.id === this.selectedMethodId)!;
  }

  get isPickup() {
    return this.selectedMethod.mode === 'Point relais';
  }

  get grandTotal() {
    return Number((this.itemsTotal + (this.shippingPrice ?? 0)).toFixed(2));
  }

  get totalWeightGrams() {
    return this.items.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);
  }

  get relayPointLabel() {
    if (!this.relayPoint) return '';
    return String(
      this.relayPoint['name'] ??
        this.relayPoint['label'] ??
        this.relayPoint['parcelPointName'] ??
        'Point relais sélectionné',
    );
  }

  get canCheckout() {
    const identityValid =
      !!this.form.firstName.trim() &&
      !!this.form.lastName.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim());
    const deliveryValid = this.isPickup
      ? !!this.relayPoint
      : !!this.form.phone.trim() &&
        !!this.form.address.trim() &&
        /^\d{5}$/.test(this.form.postalCode.trim()) &&
        !!this.form.city.trim();
    return identityValid && deliveryValid && this.legalAccepted &&
      this.shippingPrice !== null && !this.isCheckingOut;
  }

  ngAfterViewInit() {
    this.viewReady = true;
    void this.prepareMap();
  }

  async ngOnInit() {
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('carrier, delivery_mode, weight_min_grams, weight_max_grams, price');
    if (error) {
      this.errorMessage = 'Les frais de livraison sont indisponibles pour le moment.';
      return;
    }
    this.shippingRates = data ?? [];
    this.updateShippingPrice();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] && this.items.length === 0) {
      this.relayPoint = null;
    }
    if (changes['items']) this.updateShippingPrice();
  }

  selectMethod(methodId: DeliveryMethodId) {
    this.selectedMethodId = methodId;
    this.errorMessage = '';
    this.relayPoint = null;
    this.updateShippingPrice();
    if (this.isPickup && this.viewReady) {
      setTimeout(() => void this.prepareMap());
    }
  }

  async searchRelayPoints() {
    if (!/^\d{5}$/.test(this.form.postalCode.trim()) || !this.form.city.trim()) {
      this.mapMessage = 'Indiquez un code postal et une ville pour afficher les points relais.';
      return;
    }
    await this.prepareMap(true);
  }

  async checkout() {
    if (!this.canCheckout) return;
    this.errorMessage = '';
    this.isCheckingOut = true;
    this.checkoutStarted.emit();
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          legalAccepted: true,
          items: this.items.map((item) => ({ boxId: item.boxId, quantity: item.quantity })),
          delivery: {
            method: this.selectedMethodId,
            firstName: this.form.firstName.trim(),
            lastName: this.form.lastName.trim(),
            email: this.form.email.trim(),
            phone: this.form.phone.trim() || undefined,
            address: this.form.address.trim() || undefined,
            postalCode: this.form.postalCode.trim() || undefined,
            city: this.form.city.trim() || undefined,
            relayPoint: this.isPickup ? this.relayPoint : undefined,
          },
        },
      });
      if (error || !data?.url) {
        this.errorMessage = data?.error || 'Le paiement est indisponible pour le moment.';
        return;
      }
      window.location.assign(data.url);
    } catch {
      this.errorMessage = 'Le paiement est indisponible pour le moment.';
    } finally {
      this.isCheckingOut = false;
      this.checkoutFinished.emit();
    }
  }

  private async prepareMap(runSearch = false) {
    if (!this.isPickup || !document.querySelector('#boxtal-parcel-map')) return;
    this.isMapLoading = true;
    this.mapMessage = '';
    try {
      await this.loadMapScript();
      const { data, error } = await supabase.functions.invoke('boxtal-map-token');
      if (error || !data?.accessToken) throw new Error('Token Boxtal indisponible');
      const config = this.mapConfig();
      if (!this.map) {
        const Constructor = window.BoxtalParcelPointMap?.BoxtalParcelPointMap;
        if (!Constructor) throw new Error('Composant Boxtal indisponible');
        this.map = new Constructor({
          domToLoadMap: '#boxtal-parcel-map',
          accessToken: data.accessToken,
          config,
          onMapLoaded: () => {
            if (runSearch || (this.form.postalCode && this.form.city)) this.runMapSearch();
          },
        });
      } else {
        this.map.updateConfig(config);
        if (runSearch) this.runMapSearch();
      }
    } catch {
      this.mapMessage =
        'La carte sera disponible dès que la clé Boxtal sera configurée. Vous ne pouvez pas payer sans sélectionner un relais.';
    } finally {
      this.isMapLoading = false;
    }
  }

  private updateShippingPrice() {
    const carrier = this.selectedMethodId.startsWith('mondial_relay')
      ? 'mondial_relay' : 'laposte';
    const deliveryMode = this.selectedMethodId.endsWith('_pickup') ? 'pickup' : 'home';
    const rate = this.shippingRates.find((entry) =>
      entry.carrier === carrier && entry.delivery_mode === deliveryMode &&
      this.totalWeightGrams >= entry.weight_min_grams &&
      this.totalWeightGrams <= entry.weight_max_grams);
    this.shippingPrice = rate ? Number(rate.price) : null;
    if (this.shippingRates.length && !rate) {
      this.errorMessage = 'Aucun tarif de livraison ne couvre le poids de cette commande.';
    }
  }

  private runMapSearch() {
    this.map?.searchParcelPoints(
      {
        country: 'FR',
        zipCode: this.form.postalCode.trim(),
        city: this.form.city.trim(),
      },
      (point) => {
        this.relayPoint = point;
        this.mapMessage = '';
      },
    );
  }

  private mapConfig() {
    const network = 'network' in this.selectedMethod
      ? this.selectedMethod.network
      : 'MONR_NETWORK';
    return {
      locale: 'fr',
      parcelPointNetworks: [{ code: network, markerTemplate: { color: '#7a45c6' } }],
      options: { primaryColor: '#7a45c6', autoSelectNearestParcelPoint: false },
    };
  }

  private loadMapScript() {
    const existing = document.querySelector<HTMLScriptElement>('script[data-boxtal-map]');
    if (existing) {
      if (window.BoxtalParcelPointMap) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(), { once: true });
      });
    }
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://maps.boxtal.com/app/v3/assets/dependencies/@boxtal/parcel-point-map/dist/index.js';
      script.dataset['boxtalMap'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }
}
