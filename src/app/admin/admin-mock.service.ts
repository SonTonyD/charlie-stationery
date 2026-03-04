import { Injectable } from '@angular/core';
import { AdminBox, AdminProduct } from './admin.models';

interface AdminProductPayload {
  name: string;
  purchaseUnitPrice: number;
  defaultSalePrice: number;
}

interface AdminBoxPayload {
  name: string;
  description: string;
  showOnFrontOffice?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminMockService {
  private readonly storageKey = 'charlies-stationery-admin-state-v1';

  private readonly defaultProducts: AdminProduct[] = [
    {
      id: 'prd-1',
      name: 'Cahier Pastel',
      purchaseUnitPrice: 2.1,
      defaultSalePrice: 4.5,
      stockQuantity: 14,
    },
    {
      id: 'prd-2',
      name: 'Stylo Gel',
      purchaseUnitPrice: 0.8,
      defaultSalePrice: 2.4,
      stockQuantity: 20,
    },
    {
      id: 'prd-3',
      name: 'Sticker Kawaii',
      purchaseUnitPrice: 0.3,
      defaultSalePrice: 1.2,
      stockQuantity: 40,
    },
    {
      id: 'prd-4',
      name: 'Magnet',
      purchaseUnitPrice: 1.1,
      defaultSalePrice: 2.8,
      stockQuantity: 11,
    },
  ];

  private readonly defaultBoxes: AdminBox[] = [
    {
      id: 'box-1',
      name: 'Box Premium',
      description: 'Selection premium orientee ecriture et deco.',
      showOnFrontOffice: true,
      items: [
        { productId: 'prd-1', quantity: 3, salePrice: 4.5 },
        { productId: 'prd-2', quantity: 5, salePrice: 2.4 },
        { productId: 'prd-3', quantity: 1, salePrice: 1.2 },
        { productId: 'prd-4', quantity: 3, salePrice: 2.8 },
      ],
    },
    {
      id: 'box-2',
      name: 'Box Petite',
      description: 'Format compact pour petits cadeaux du quotidien.',
      showOnFrontOffice: false,
      items: [
        { productId: 'prd-1', quantity: 1, salePrice: 4.2 },
        { productId: 'prd-2', quantity: 2, salePrice: 2.2 },
        { productId: 'prd-3', quantity: 2, salePrice: 1.1 },
      ],
    },
    {
      id: 'box-3',
      name: 'Box Fashion',
      description: 'Selection tendance orientee accessoires et deco.',
      showOnFrontOffice: false,
      items: [
        { productId: 'prd-2', quantity: 3, salePrice: 2.5 },
        { productId: 'prd-3', quantity: 4, salePrice: 1.3 },
        { productId: 'prd-4', quantity: 2, salePrice: 3.1 },
      ],
    },
  ];

  private products: AdminProduct[] = [];
  private boxes: AdminBox[] = [];

  constructor() {
    this.hydrateState();
  }

  getProducts() {
    return this.products.map((product) => ({ ...product }));
  }

  getBoxes() {
    return this.boxes.map((box) => ({
      ...box,
      items: box.items.map((item) => ({ ...item })),
    }));
  }

  createProduct(payload: AdminProductPayload) {
    const product: AdminProduct = {
      id: this.generateId('prd'),
      ...payload,
      stockQuantity: 0,
    };
    this.products = [...this.products, product];
    this.persistState();
    return { ...product };
  }

  updateProduct(productId: string, payload: AdminProductPayload) {
    this.products = this.products.map((product) =>
      product.id === productId
        ? {
            id: productId,
            ...payload,
            stockQuantity: product.stockQuantity,
          }
        : product,
    );
    this.persistState();
  }

  updateProductStock(productId: string, stockQuantity: number) {
    this.products = this.products.map((product) =>
      product.id === productId ? { ...product, stockQuantity } : product,
    );
    this.persistState();
  }

  deleteProduct(productId: string) {
    this.products = this.products.filter((product) => product.id !== productId);
    this.boxes = this.boxes.map((box) => ({
      ...box,
      items: box.items.filter((item) => item.productId !== productId),
    }));
    this.persistState();
  }

  createBox(payload: AdminBoxPayload) {
    const box: AdminBox = {
      id: this.generateId('box'),
      name: payload.name,
      description: payload.description,
      showOnFrontOffice: payload.showOnFrontOffice ?? false,
      items: [],
    };
    this.boxes = [...this.boxes, box];
    this.persistState();
    return { ...box, items: [] };
  }

  updateBox(
    boxId: string,
    payload: Pick<AdminBox, 'name' | 'description' | 'showOnFrontOffice'>,
  ) {
    this.boxes = this.boxes.map((box) =>
      box.id === boxId ? { ...box, ...payload } : box,
    );
    this.persistState();
  }

  deleteBox(boxId: string) {
    this.boxes = this.boxes.filter((box) => box.id !== boxId);
    this.persistState();
  }

  addProductToBox(boxId: string, productId: string) {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    this.boxes = this.boxes.map((box) => {
      if (box.id !== boxId) {
        return box;
      }

      const existingItem = box.items.find(
        (item) => item.productId === productId,
      );
      if (existingItem) {
        return {
          ...box,
          items: box.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      return {
        ...box,
        items: [
          ...box.items,
          { productId, quantity: 1, salePrice: product.defaultSalePrice },
        ],
      };
    });
    this.persistState();
  }

  updateBoxItem(
    boxId: string,
    productId: string,
    payload: { quantity?: number; salePrice?: number },
  ) {
    this.boxes = this.boxes.map((box) =>
      box.id === boxId
        ? {
            ...box,
            items: box.items.map((item) =>
              item.productId === productId ? { ...item, ...payload } : item,
            ),
          }
        : box,
    );
    this.persistState();
  }

  removeProductFromBox(boxId: string, productId: string) {
    this.boxes = this.boxes.map((box) =>
      box.id === boxId
        ? {
            ...box,
            items: box.items.filter((item) => item.productId !== productId),
          }
        : box,
    );
    this.persistState();
  }

  private generateId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private hydrateState() {
    try {
      const rawState = localStorage.getItem(this.storageKey);
      if (!rawState) {
        this.resetToDefaultState();
        return;
      }

      const parsed = JSON.parse(rawState) as {
        products?: AdminProduct[];
        boxes?: AdminBox[];
      };

      const parsedProducts = Array.isArray(parsed.products) ? parsed.products : [];
      const parsedBoxes = Array.isArray(parsed.boxes) ? parsed.boxes : [];

      this.products = parsedProducts.map((product) => ({
        ...product,
        stockQuantity: Math.max(0, Math.floor(Number(product.stockQuantity) || 0)),
      }));
      this.boxes = parsedBoxes.map((box) => ({
        ...box,
        showOnFrontOffice: Boolean(box.showOnFrontOffice),
        items: Array.isArray(box.items)
          ? box.items.map((item) => ({
              ...item,
              quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
              salePrice: this.toMoney(Number(item.salePrice) || 0),
            }))
          : [],
      }));

      if (this.products.length === 0) {
        this.products = this.defaultProducts.map((product) => ({ ...product }));
      }
      if (this.boxes.length === 0) {
        this.boxes = this.defaultBoxes.map((box) => ({
          ...box,
          items: box.items.map((item) => ({ ...item })),
        }));
      }
    } catch {
      this.resetToDefaultState();
    }
  }

  private resetToDefaultState() {
    this.products = this.defaultProducts.map((product) => ({ ...product }));
    this.boxes = this.defaultBoxes.map((box) => ({
      ...box,
      items: box.items.map((item) => ({ ...item })),
    }));
    this.persistState();
  }

  private persistState() {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        products: this.products,
        boxes: this.boxes,
      }),
    );
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }
}
