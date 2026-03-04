import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminMockService } from './admin-mock.service';
import { AdminBox, AdminProduct, BoxProductLine } from './admin.models';

type AdminTab = 'products' | 'boxes';

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

    this.adminMockService.addProductToBox(this.selectedBoxId, this.addProductId);
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
    return this.toMoney(
      this.selectedBox.items.reduce((sum, item) => sum + this.getLineCost(item), 0),
    );
  }

  getBoxSalesTotal() {
    if (!this.selectedBox) {
      return 0;
    }
    return this.toMoney(
      this.selectedBox.items.reduce(
        (sum, item) => sum + this.getLineSales(item),
        0,
      ),
    );
  }

  getBoxMarginTotal() {
    return this.toMoney(this.getBoxSalesTotal() - this.getBoxCostTotal());
  }

  private refreshAll() {
    this.products = this.adminMockService.getProducts();
    this.boxes = this.adminMockService.getBoxes();
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
}
