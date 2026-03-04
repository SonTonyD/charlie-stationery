import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminMockService } from './admin-mock.service';
import { AdminBox, AdminProduct, BoxProductLine } from './admin.models';

type AdminTab = 'products' | 'boxes' | 'stocks' | 'restock';

interface RestockBoxSummary {
  boxId: string;
  boxName: string;
  targetQuantity: number;
  purchaseTotal: number;
  saleTotal: number;
  marginTotal: number;
}

interface RestockProductLine {
  productId: string;
  productName: string;
  requiredQuantity: number;
  purchaseTotal: number;
  saleTotal: number;
  marginTotal: number;
}

interface StockBoxAvailability {
  boxId: string;
  boxName: string;
  availableQuantity: number;
  limitingProducts: string[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  activeTab: AdminTab = 'products';

  products: AdminProduct[] = [];
  boxes: AdminBox[] = [];

  editingProductId: string | null = null;
  productForm = {
    name: '',
    purchaseUnitPrice: 0,
    defaultSalePrice: 0,
  };

  selectedBoxId: string | null = null;
  newBoxForm = {
    name: '',
    description: '',
  };
  selectedBoxForm = {
    name: '',
    description: '',
  };
  addProductId = '';
  restockTargets: Record<string, number> = {};

  constructor(private readonly adminMockService: AdminMockService) {
    this.refreshAll();

    if (this.boxes.length > 0) {
      this.selectBox(this.boxes[0].id);
    }
  }

  get selectedBox() {
    return this.boxes.find((box) => box.id === this.selectedBoxId) ?? null;
  }

  setActiveTab(tab: AdminTab) {
    this.activeTab = tab;
  }

  setRestockTarget(boxId: string, value: number) {
    const quantity = Math.max(0, Math.floor(Number(value) || 0));
    this.restockTargets = {
      ...this.restockTargets,
      [boxId]: quantity,
    };
  }

  getRestockTarget(boxId: string) {
    return this.restockTargets[boxId] ?? 0;
  }

  updateProductStock(productId: string, value: number) {
    const stockQuantity = Math.max(0, Math.floor(Number(value) || 0));
    this.adminMockService.updateProductStock(productId, stockQuantity);
    this.refreshAll();
  }

  saveProduct() {
    const payload = {
      name: this.productForm.name.trim(),
      purchaseUnitPrice: this.toMoney(this.productForm.purchaseUnitPrice),
      defaultSalePrice: this.toMoney(this.productForm.defaultSalePrice),
    };

    if (!payload.name) {
      return;
    }

    if (this.editingProductId) {
      this.adminMockService.updateProduct(this.editingProductId, payload);
    } else {
      this.adminMockService.createProduct(payload);
    }

    this.resetProductForm();
    this.refreshAll();
  }

  editProduct(product: AdminProduct) {
    this.editingProductId = product.id;
    this.productForm = {
      name: product.name,
      purchaseUnitPrice: product.purchaseUnitPrice,
      defaultSalePrice: product.defaultSalePrice,
    };
  }

  deleteProduct(productId: string) {
    this.adminMockService.deleteProduct(productId);
    if (this.editingProductId === productId) {
      this.resetProductForm();
    }
    this.refreshAll();
  }

  cancelProductEdit() {
    this.resetProductForm();
  }

  createBox() {
    const payload = {
      name: this.newBoxForm.name.trim(),
      description: this.newBoxForm.description.trim(),
    };

    if (!payload.name) {
      return;
    }

    const newBox = this.adminMockService.createBox(payload);
    this.newBoxForm = { name: '', description: '' };
    this.refreshAll();
    this.selectBox(newBox.id);
  }

  selectBox(boxId: string) {
    this.selectedBoxId = boxId;
    const box = this.boxes.find((item) => item.id === boxId);
    this.selectedBoxForm = {
      name: box?.name ?? '',
      description: box?.description ?? '',
    };
    this.addProductId = '';
  }

  saveBoxMeta() {
    if (!this.selectedBoxId) {
      return;
    }

    const payload = {
      name: this.selectedBoxForm.name.trim(),
      description: this.selectedBoxForm.description.trim(),
    };

    if (!payload.name) {
      return;
    }

    this.adminMockService.updateBox(this.selectedBoxId, payload);
    this.refreshAll();
  }

  deleteBox(boxId: string) {
    this.adminMockService.deleteBox(boxId);
    this.refreshAll();

    if (this.selectedBoxId === boxId) {
      if (this.boxes.length > 0) {
        this.selectBox(this.boxes[0].id);
      } else {
        this.selectedBoxId = null;
        this.selectedBoxForm = { name: '', description: '' };
      }
    }
  }

  addProductToSelectedBox() {
    if (!this.selectedBoxId || !this.addProductId) {
      return;
    }

    this.adminMockService.addProductToBox(
      this.selectedBoxId,
      this.addProductId,
    );
    this.refreshAll();
    this.addProductId = '';
  }

  updateBoxItemQuantity(item: BoxProductLine, value: number) {
    if (!this.selectedBoxId) {
      return;
    }

    const quantity = Math.max(1, Math.floor(Number(value) || 1));
    this.adminMockService.updateBoxItem(this.selectedBoxId, item.productId, {
      quantity,
    });
    this.refreshAll();
  }

  updateBoxItemSalePrice(item: BoxProductLine, value: number) {
    if (!this.selectedBoxId) {
      return;
    }

    const salePrice = Math.max(0, this.toMoney(Number(value) || 0));
    this.adminMockService.updateBoxItem(this.selectedBoxId, item.productId, {
      salePrice,
    });
    this.refreshAll();
  }

  removeProductFromSelectedBox(productId: string) {
    if (!this.selectedBoxId) {
      return;
    }

    this.adminMockService.removeProductFromBox(this.selectedBoxId, productId);
    this.refreshAll();
  }

  getProductById(productId: string) {
    return this.products.find((product) => product.id === productId) ?? null;
  }

  getUnitMargin(item: BoxProductLine) {
    const product = this.getProductById(item.productId);
    if (!product) {
      return 0;
    }
    return this.toMoney(item.salePrice - product.purchaseUnitPrice);
  }

  getLineCost(item: BoxProductLine) {
    const product = this.getProductById(item.productId);
    if (!product) {
      return 0;
    }
    return this.toMoney(product.purchaseUnitPrice * item.quantity);
  }

  getLineSales(item: BoxProductLine) {
    return this.toMoney(item.salePrice * item.quantity);
  }

  getLineMargin(item: BoxProductLine) {
    return this.toMoney(this.getLineSales(item) - this.getLineCost(item));
  }

  getBoxCostTotal() {
    if (!this.selectedBox) {
      return 0;
    }
    return this.getBoxPurchaseTotal(this.selectedBox);
  }

  getBoxSalesTotal() {
    if (!this.selectedBox) {
      return 0;
    }
    return this.getBoxSaleTotal(this.selectedBox);
  }

  getBoxMarginTotal() {
    return this.toMoney(this.getBoxSalesTotal() - this.getBoxCostTotal());
  }

  getRestockBoxSummaries() {
    return this.boxes
      .map((box) => {
        const targetQuantity = this.getRestockTarget(box.id);
        const purchaseTotal = this.toMoney(
          this.getBoxPurchaseTotal(box) * targetQuantity,
        );
        const saleTotal = this.toMoney(
          this.getBoxSaleTotal(box) * targetQuantity,
        );
        const marginTotal = this.toMoney(saleTotal - purchaseTotal);

        return {
          boxId: box.id,
          boxName: box.name,
          targetQuantity,
          purchaseTotal,
          saleTotal,
          marginTotal,
        } satisfies RestockBoxSummary;
      })
      .filter((summary) => summary.targetQuantity > 0);
  }

  getRestockProductLines() {
    const linesByProduct = new Map<string, RestockProductLine>();

    for (const box of this.boxes) {
      const targetQuantity = this.getRestockTarget(box.id);
      if (targetQuantity <= 0) {
        continue;
      }

      for (const item of box.items) {
        const product = this.getProductById(item.productId);
        if (!product) {
          continue;
        }

        const requiredQuantity = item.quantity * targetQuantity;
        const purchaseTotal = this.toMoney(
          product.purchaseUnitPrice * requiredQuantity,
        );
        const saleTotal = this.toMoney(item.salePrice * requiredQuantity);
        const existing = linesByProduct.get(item.productId);

        if (existing) {
          linesByProduct.set(item.productId, {
            ...existing,
            requiredQuantity: existing.requiredQuantity + requiredQuantity,
            purchaseTotal: this.toMoney(existing.purchaseTotal + purchaseTotal),
            saleTotal: this.toMoney(existing.saleTotal + saleTotal),
            marginTotal: this.toMoney(
              existing.marginTotal + (saleTotal - purchaseTotal),
            ),
          });
        } else {
          linesByProduct.set(item.productId, {
            productId: product.id,
            productName: product.name,
            requiredQuantity,
            purchaseTotal,
            saleTotal,
            marginTotal: this.toMoney(saleTotal - purchaseTotal),
          });
        }
      }
    }

    return [...linesByProduct.values()].sort((a, b) =>
      a.productName.localeCompare(b.productName),
    );
  }

  getRestockTotalBoxes() {
    return this.boxes.reduce(
      (sum, box) => sum + this.getRestockTarget(box.id),
      0,
    );
  }

  getRestockPurchaseTotal() {
    return this.toMoney(
      this.getRestockBoxSummaries().reduce(
        (sum, boxSummary) => sum + boxSummary.purchaseTotal,
        0,
      ),
    );
  }

  getRestockSaleTotal() {
    return this.toMoney(
      this.getRestockBoxSummaries().reduce(
        (sum, boxSummary) => sum + boxSummary.saleTotal,
        0,
      ),
    );
  }

  getRestockMarginTotal() {
    return this.toMoney(
      this.getRestockSaleTotal() - this.getRestockPurchaseTotal(),
    );
  }

  getRestockMarginRate() {
    const saleTotal = this.getRestockSaleTotal();
    if (saleTotal <= 0) {
      return 0;
    }
    return this.toMoney((this.getRestockMarginTotal() / saleTotal) * 100);
  }

  getStockBoxAvailabilities() {
    return this.boxes.map((box) => {
      if (box.items.length === 0) {
        return {
          boxId: box.id,
          boxName: box.name,
          availableQuantity: 0,
          limitingProducts: [],
        } satisfies StockBoxAvailability;
      }

      let maxBoxes = Number.POSITIVE_INFINITY;
      let limitingProductIds = new Set<string>();

      for (const item of box.items) {
        const product = this.getProductById(item.productId);
        const itemCapacity =
          !product || item.quantity <= 0
            ? 0
            : Math.floor(product.stockQuantity / item.quantity);

        if (itemCapacity < maxBoxes) {
          maxBoxes = itemCapacity;
          limitingProductIds = new Set<string>([item.productId]);
        } else if (itemCapacity === maxBoxes) {
          limitingProductIds.add(item.productId);
        }
      }

      return {
        boxId: box.id,
        boxName: box.name,
        availableQuantity: Number.isFinite(maxBoxes) ? maxBoxes : 0,
        limitingProducts: [...limitingProductIds]
          .map((id) => this.getProductById(id)?.name)
          .filter((name): name is string => !!name)
          .sort((a, b) => a.localeCompare(b)),
      } satisfies StockBoxAvailability;
    });
  }

  getTotalStockUnits() {
    return this.products.reduce(
      (sum, product) => sum + product.stockQuantity,
      0,
    );
  }

  private refreshAll() {
    this.products = this.adminMockService.getProducts();
    this.boxes = this.adminMockService.getBoxes();
    this.synchronizeRestockTargets();
  }

  private resetProductForm() {
    this.editingProductId = null;
    this.productForm = {
      name: '',
      purchaseUnitPrice: 0,
      defaultSalePrice: 0,
    };
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }

  private getBoxPurchaseTotal(box: AdminBox) {
    return this.toMoney(
      box.items.reduce((sum, item) => sum + this.getLineCost(item), 0),
    );
  }

  private getBoxSaleTotal(box: AdminBox) {
    return this.toMoney(
      box.items.reduce((sum, item) => sum + this.getLineSales(item), 0),
    );
  }

  private synchronizeRestockTargets() {
    const synchronized: Record<string, number> = {};
    for (const box of this.boxes) {
      synchronized[box.id] = this.getRestockTarget(box.id);
    }
    this.restockTargets = synchronized;
  }
}
