import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  cartItemId: string;
  boxId: string;
  variantId?: string;
  variantName?: string;
  name: string;
  description: string;
  image: string;
  unitPrice: number;
  weightGrams: number;
  stockQuantity: number;
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
    const existingItem = items.find(
      (cartItem) => cartItem.cartItemId === item.cartItemId,
    );

    if (existingItem) {
      this.setItems(
        items.map((cartItem) =>
          cartItem.cartItemId === item.cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
      return;
    }

    this.setItems([...items, { ...item, quantity: 1 }]);
  }

  updateQuantity(cartItemId: string, quantity: number) {
    const item = this.getItems().find((entry) => entry.cartItemId === cartItemId);
    if (!item) return;
    const otherQuantity = this.getItems()
      .filter((entry) => entry.boxId === item.boxId && entry.cartItemId !== cartItemId)
      .reduce((sum, entry) => sum + entry.quantity, 0);
    const normalizedQuantity = Math.min(
      Math.max(0, item.stockQuantity - otherQuantity),
      Math.max(0, Math.floor(Number(quantity) || 0)),
    );

    if (normalizedQuantity === 0) {
      this.removeItem(cartItemId);
      return;
    }

    this.setItems(
      this.getItems().map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: normalizedQuantity } : item,
      ),
    );
  }

  increment(cartItemId: string) {
    const item = this.getItems().find((cartItem) => cartItem.cartItemId === cartItemId);
    if (item && this.getBoxQuantity(item.boxId) < item.stockQuantity) {
      this.updateQuantity(cartItemId, item.quantity + 1);
    }
  }

  getBoxQuantity(boxId: string) {
    return this.getItems()
      .filter((item) => item.boxId === boxId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  reconcileStock(stockByBoxId: Map<string, number>) {
    const usedByBoxId = new Map<string, number>();
    const items = this.getItems()
      .map((item) => {
        const stockQuantity = Math.max(
          0,
          Math.floor(stockByBoxId.get(item.boxId) ?? 0),
        );
        const used = usedByBoxId.get(item.boxId) ?? 0;
        const quantity = Math.min(item.quantity, Math.max(0, stockQuantity - used));
        usedByBoxId.set(item.boxId, used + quantity);
        return { ...item, stockQuantity, quantity };
      })
      .filter((item) => item.quantity > 0);
    this.setItems(items);
  }

  decrement(cartItemId: string) {
    const item = this.getItems().find((cartItem) => cartItem.cartItemId === cartItemId);
    if (item) {
      this.updateQuantity(cartItemId, item.quantity - 1);
    }
  }

  removeItem(cartItemId: string) {
    this.setItems(this.getItems().filter((item) => item.cartItemId !== cartItemId));
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
            cartItemId:
              typeof item.cartItemId === 'string'
                ? item.cartItemId
                : `${item.boxId}:${typeof item.variantId === 'string' ? item.variantId : 'default'}`,
            boxId: item.boxId,
            variantId: typeof item.variantId === 'string' ? item.variantId : undefined,
            variantName: typeof item.variantName === 'string' ? item.variantName : undefined,
            name: item.name,
            description:
              typeof item.description === 'string' ? item.description : '',
            image: typeof item.image === 'string' ? item.image : '/alien-box.jpeg',
            unitPrice: this.toMoney(Number(item.unitPrice) || 0),
            weightGrams: Math.max(1, Math.floor(Number(item.weightGrams) || 1)),
            stockQuantity: Math.max(
              0,
              Math.floor(Number(item.stockQuantity) || 0),
            ),
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
