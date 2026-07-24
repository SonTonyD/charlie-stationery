import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from './cart.service';
import { DeliveryFormComponent } from './delivery-form.component';
import { LegalConsentComponent } from './legal-consent.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, LegalConsentComponent, DeliveryFormComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  items: CartItem[] = [];
  isCheckingOut = false;
  errorMessage = '';
  legalAccepted = false;

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

  checkoutStarted() {
    this.isCheckingOut = true;
    this.cartService.markCheckoutStarted();
  }

  checkoutFinished() {
    this.isCheckingOut = false;
  }
}
