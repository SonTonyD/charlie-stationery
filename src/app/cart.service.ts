import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  boxId: string;
  name: string;
  description: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'charlies-stationery-cart';
  private readonly pendingCheckoutKey = 'charlies-stationery-cart-checkout';
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(
    this.readItems(),
  );

  readonly items$ = this.itemsSubject.asObservable();

  getItems() {
    return this.itemsSubject.value;
  }

  getTotalQuantity() {
    return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice() {
    return this.toMoney(
      this.getItems().reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    );
  }

  addItem(item: Omit<CartItem, 'quantity'>) {
    const items = this.getItems();
    const existingItem = items.find((cartItem) => cartItem.boxId === item.boxId);

    if (existingItem) {
      this.setItems(
        items.map((cartItem) =>
          cartItem.boxId === item.boxId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
      return;
    }

    this.setItems([...items, { ...item, quantity: 1 }]);
  }

  updateQuantity(boxId: string, quantity: number) {
    const normalizedQuantity = Math.max(0, Math.floor(Number(quantity) || 0));

    if (normalizedQuantity === 0) {
      this.removeItem(boxId);
      return;
    }

    this.setItems(
      this.getItems().map((item) =>
        item.boxId === boxId ? { ...item, quantity: normalizedQuantity } : item,
      ),
    );
  }

  increment(boxId: string) {
    const item = this.getItems().find((cartItem) => cartItem.boxId === boxId);
    if (item) {
      this.updateQuantity(boxId, item.quantity + 1);
    }
  }

  decrement(boxId: string) {
    const item = this.getItems().find((cartItem) => cartItem.boxId === boxId);
    if (item) {
      this.updateQuantity(boxId, item.quantity - 1);
    }
  }

  removeItem(boxId: string) {
    this.setItems(this.getItems().filter((item) => item.boxId !== boxId));
  }

  clear() {
    this.setItems([]);
    localStorage.removeItem(this.pendingCheckoutKey);
  }

  markCheckoutStarted() {
    localStorage.setItem(this.pendingCheckoutKey, 'true');
  }

  clearAfterSuccessfulCheckout() {
    if (localStorage.getItem(this.pendingCheckoutKey) === 'true') {
      this.clear();
    }
  }

  clearPendingCheckout() {
    localStorage.removeItem(this.pendingCheckoutKey);
  }

  private setItems(items: CartItem[]) {
    this.itemsSubject.next(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private readItems() {
    try {
      const rawItems = localStorage.getItem(this.storageKey);
      if (!rawItems) {
        return [];
      }

      const parsedItems = JSON.parse(rawItems);
      if (!Array.isArray(parsedItems)) {
        return [];
      }

      return parsedItems
        .map((item): CartItem | null => {
          if (
            !item ||
            typeof item.boxId !== 'string' ||
            typeof item.name !== 'string'
          ) {
            return null;
          }

          return {
            boxId: item.boxId,
            name: item.name,
            description:
              typeof item.description === 'string' ? item.description : '',
            image: typeof item.image === 'string' ? item.image : '/alien-box.jpeg',
            unitPrice: this.toMoney(Number(item.unitPrice) || 0),
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
          };
        })
        .filter((item): item is CartItem => item !== null);
    } catch {
      return [];
    }
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }
}
