import { Injectable } from '@angular/core';
import { AdminBox, AdminProduct } from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminMockService {
  private products: AdminProduct[] = [
    {
      id: 'prd-1',
      name: 'Cahier Pastel',
      purchaseUnitPrice: 2.1,
      defaultSalePrice: 4.5,
    },
    {
      id: 'prd-2',
      name: 'Stylo Gel',
      purchaseUnitPrice: 0.8,
      defaultSalePrice: 2.4,
    },
    {
      id: 'prd-3',
      name: 'Sticker Kawaii',
      purchaseUnitPrice: 0.3,
      defaultSalePrice: 1.2,
    },
    {
      id: 'prd-4',
      name: 'Magnet',
      purchaseUnitPrice: 1.1,
      defaultSalePrice: 2.8,
    },
  ];

  private boxes: AdminBox[] = [
    {
      id: 'box-1',
      name: 'Box Premium',
      description: 'Selection premium orientee ecriture et deco.',
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
      items: [
        { productId: 'prd-2', quantity: 3, salePrice: 2.5 },
        { productId: 'prd-3', quantity: 4, salePrice: 1.3 },
        { productId: 'prd-4', quantity: 2, salePrice: 3.1 },
      ],
    },
  ];

  getProducts() {
    return this.products.map((product) => ({ ...product }));
  }

  getBoxes() {
    return this.boxes.map((box) => ({
      ...box,
      items: box.items.map((item) => ({ ...item })),
    }));
  }

  createProduct(payload: Omit<AdminProduct, 'id'>) {
    const product: AdminProduct = { id: this.generateId('prd'), ...payload };
    this.products = [...this.products, product];
    return { ...product };
  }

  updateProduct(productId: string, payload: Omit<AdminProduct, 'id'>) {
    this.products = this.products.map((product) =>
      product.id === productId ? { id: productId, ...payload } : product,
    );
  }

  deleteProduct(productId: string) {
    this.products = this.products.filter((product) => product.id !== productId);
    this.boxes = this.boxes.map((box) => ({
      ...box,
      items: box.items.filter((item) => item.productId !== productId),
    }));
  }

  createBox(payload: Omit<AdminBox, 'id' | 'items'>) {
    const box: AdminBox = {
      id: this.generateId('box'),
      name: payload.name,
      description: payload.description,
      items: [],
    };
    this.boxes = [...this.boxes, box];
    return { ...box, items: [] };
  }

  updateBox(boxId: string, payload: Pick<AdminBox, 'name' | 'description'>) {
    this.boxes = this.boxes.map((box) =>
      box.id === boxId ? { ...box, ...payload } : box,
    );
  }

  deleteBox(boxId: string) {
    this.boxes = this.boxes.filter((box) => box.id !== boxId);
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

      const existingItem = box.items.find((item) => item.productId === productId);
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
  }

  private generateId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
