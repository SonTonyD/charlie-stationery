import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from './cart.service';
import { DeliveryFormComponent } from './delivery-form.component';
import { LegalConsentComponent } from './legal-consent.component';
import { AdminMockService } from './admin/admin-mock.service';

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

  constructor(
    private readonly cartService: CartService,
    private readonly adminService: AdminMockService,
  ) {}

  async ngOnInit() {
    this.items = this.cartService.getItems();
    this.cartSubscription = this.cartService.items$.subscribe((items) => {
      this.items = items;
    });
    try {
      const boxes = await this.adminService.getBoxes();
      this.cartService.reconcileStock(
        new Map(boxes.map((box) => [box.id, box.stockQuantity])),
      );
    } catch {
      this.errorMessage =
        'Impossible de vérifier le stock disponible pour le moment.';
    }
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

  increment(cartItemId: string) {
    this.cartService.increment(cartItemId);
  }

  decrement(cartItemId: string) {
    this.cartService.decrement(cartItemId);
  }

  removeItem(cartItemId: string) {
    this.cartService.removeItem(cartItemId);
  }

  getLineTotal(item: CartItem) {
    return Number((item.unitPrice * item.quantity).toFixed(2));
  }

  isAtMaximumStock(item: CartItem) {
    return this.cartService.getBoxQuantity(item.boxId) >= item.stockQuantity;
  }

  checkoutStarted() {
    this.isCheckingOut = true;
    this.cartService.markCheckoutStarted();
  }

  checkoutFinished() {
    this.isCheckingOut = false;
  }
}
