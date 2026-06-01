import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from './cart.service';
import { supabase } from './supabase/supabase.client';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  items: CartItem[] = [];
  isCheckingOut = false;
  errorMessage = '';

  private cartSubscription: Subscription | null = null;

  constructor(private readonly cartService: CartService) {}

  ngOnInit() {
    this.items = this.cartService.getItems();
    this.cartSubscription = this.cartService.items$.subscribe((items) => {
      this.items = items;
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  get totalQuantity() {
    return this.cartService.getTotalQuantity();
  }

  get totalPrice() {
    return this.cartService.getTotalPrice();
  }

  get canCheckout() {
    return this.items.length > 0 && !this.isCheckingOut;
  }

  increment(boxId: string) {
    this.cartService.increment(boxId);
  }

  decrement(boxId: string) {
    this.cartService.decrement(boxId);
  }

  removeItem(boxId: string) {
    this.cartService.removeItem(boxId);
  }

  getLineTotal(item: CartItem) {
    return Number((item.unitPrice * item.quantity).toFixed(2));
  }

  async checkout() {
    if (!this.canCheckout) {
      return;
    }

    this.errorMessage = '';
    this.isCheckingOut = true;

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            items: this.items.map((item) => ({
              boxId: item.boxId,
              quantity: item.quantity,
            })),
          },
        },
      );

      if (error || !data?.url) {
        this.errorMessage = 'Le paiement est indisponible pour le moment.';
        return;
      }

      this.cartService.markCheckoutStarted();
      window.location.assign(data.url);
    } catch {
      this.errorMessage = 'Le paiement est indisponible pour le moment.';
    } finally {
      this.isCheckingOut = false;
    }
  }
}
