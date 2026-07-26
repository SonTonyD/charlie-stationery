import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminMockService } from './admin-mock.service';
import {
  AdminBox,
  AdminBoxImage,
  AdminOrder,
  AdminProduct,
  BoxProductLine,
  OrderStatus,
  ShippingRate,
  AdminReview,
} from './admin.models';
import { SupabaseAuthService } from '../supabase/auth.service';

type AdminTab = 'boxes' | 'stocks' | 'shipping' | 'reviews' | 'orders';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: AdminTab = 'boxes';
  isLoading = true;
  errorMessage = '';
  currentUserEmail = '';

  products: AdminProduct[] = [];
  boxes: AdminBox[] = [];
  orders: AdminOrder[] = [];
  shippingRates: ShippingRate[] = [];
  reviews: AdminReview[] = [];
  readonly orderStatuses: { value: OrderStatus; label: string }[] = [
    { value: 'pending_payment', label: 'En attente de paiement' },
    { value: 'paid', label: 'Payée' },
    { value: 'preparing', label: 'En préparation' },
    { value: 'shipped', label: 'Expédiée' },
    { value: 'delivered', label: 'Livrée' },
    { value: 'cancelled', label: 'Annulée' },
  ];

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
    salePrice: 0,
    purchasePrice: null as number | null,
    weightGrams: 1,
    imageUrl: '/alien-box.jpeg',
  };
  newBoxImageFiles: File[] = [];
  selectedBoxForm = {
    name: '',
    description: '',
    salePrice: 0,
    purchasePrice: null as number | null,
    weightGrams: 1,
    imageUrl: '/alien-box.jpeg',
    showOnFrontOffice: false,
  };
  selectedBoxImageFiles: File[] = [];
  selectedBoxCompleteImageFiles: File[] = [];
  addProductId = '';
  restockTargets: Record<string, number> = {};
  private authSubscription: { unsubscribe: () => void } | null = null;

  constructor(
    private readonly adminMockService: AdminMockService,
    private readonly authService: SupabaseAuthService,
    private readonly router: Router,
  ) {}

  async ngOnInit() {
    await this.refreshAll();

    this.authSubscription = this.authService.onAuthStateChange((session) => {
      if (!session) {
        void this.router.navigateByUrl('/admin/login');
        return;
      }
      this.currentUserEmail = session.user.email ?? '';
    });

    try {
      const session = await this.authService.getSession();
      this.currentUserEmail = session?.user.email ?? '';
    } catch (error) {
      this.errorMessage = this.formatError(error);
    }
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  get selectedBox() {
    return this.boxes.find((box) => box.id === this.selectedBoxId) ?? null;
  }

  setActiveTab(tab: AdminTab) {
    this.activeTab = tab;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    await this.runAction(() => this.adminMockService.updateOrderStatus(orderId, status));
  }

  async updateReviewPublication(reviewId: string, isPublished: boolean) {
    await this.runAction(() =>
      this.adminMockService.updateReviewPublication(reviewId, isPublished),
    );
  }

  relayDescription(order: AdminOrder) {
    if (!order.relayPoint) return '—';
    const point = order.relayPoint;
    return [
      point['name'] ?? point['label'] ?? point['parcelPointName'],
      point['address'] ?? point['street'],
      point['zipCode'] ?? point['postalCode'],
      point['city'],
    ].filter(Boolean).join(' · ') || JSON.stringify(point);
  }

  orderItemsLabel(order: AdminOrder) {
    return order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ');
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

  async updateProductStock(productId: string, value: number) {
    const stockQuantity = Math.max(0, Math.floor(Number(value) || 0));
    await this.runAction(() =>
      this.adminMockService.updateProductStock(productId, stockQuantity),
    );
  }

  async saveProduct() {
    const payload = {
      name: this.productForm.name.trim(),
      purchaseUnitPrice: this.toMoney(this.productForm.purchaseUnitPrice),
      defaultSalePrice: this.toMoney(this.productForm.defaultSalePrice),
    };

    if (!payload.name) {
      return;
    }

    if (this.editingProductId) {
      await this.runAction(() =>
        this.adminMockService.updateProduct(this.editingProductId!, payload),
      );
    } else {
      await this.runAction(() => this.adminMockService.createProduct(payload));
    }

    this.resetProductForm();
  }

  editProduct(product: AdminProduct) {
    this.editingProductId = product.id;
    this.productForm = {
      name: product.name,
      purchaseUnitPrice: product.purchaseUnitPrice,
      defaultSalePrice: product.defaultSalePrice,
    };
  }

  async deleteProduct(productId: string) {
    await this.runAction(() => this.adminMockService.deleteProduct(productId));
    if (this.editingProductId === productId) {
      this.resetProductForm();
    }
  }

  async updateBoxStock(boxId: string, value: number) {
    const stockQuantity = Math.max(0, Math.floor(Number(value) || 0));
    await this.runAction(() =>
      this.adminMockService.updateBoxStock(boxId, stockQuantity),
    );
  }

  cancelProductEdit() {
    this.resetProductForm();
  }

  async createBox() {
    const payload = {
      name: this.newBoxForm.name.trim(),
      description: this.newBoxForm.description.trim(),
      salePrice: Math.max(0, this.toMoney(Number(this.newBoxForm.salePrice) || 0)),
      purchasePrice: this.normalizeOptionalPrice(this.newBoxForm.purchasePrice),
      weightGrams: Math.max(1, Math.floor(Number(this.newBoxForm.weightGrams) || 1)),
      imageUrl: this.normalizeImageUrl(this.newBoxForm.imageUrl),
    };

    if (!payload.name) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    try {
      const newBox = await this.adminMockService.createBox(payload);
      if (this.newBoxImageFiles.length > 0) {
        await this.adminMockService.uploadBoxImages(
          newBox.id,
          this.newBoxImageFiles,
        );
      }
      this.newBoxForm = {
        name: '',
        description: '',
        salePrice: 0,
        purchasePrice: null,
        weightGrams: 1,
        imageUrl: '/alien-box.jpeg',
      };
      this.newBoxImageFiles = [];
      await this.refreshAll();
      this.selectBox(newBox.id);
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.isLoading = false;
    }
  }

  selectBox(boxId: string) {
    this.selectedBoxId = boxId;
    const box = this.boxes.find((item) => item.id === boxId);
    this.selectedBoxForm = {
      name: box?.name ?? '',
      description: box?.description ?? '',
      salePrice: box?.salePrice ?? 0,
      purchasePrice: box?.purchasePrice ?? null,
      weightGrams: box?.weightGrams ?? 1,
      imageUrl: box?.imageUrl ?? '/alien-box.jpeg',
      showOnFrontOffice: box?.showOnFrontOffice ?? false,
    };
    this.addProductId = '';
  }

  async saveBoxMeta() {
    if (!this.selectedBoxId) {
      return;
    }

    const payload = {
      name: this.selectedBoxForm.name.trim(),
      description: this.selectedBoxForm.description.trim(),
      salePrice: Math.max(0, this.toMoney(Number(this.selectedBoxForm.salePrice) || 0)),
      purchasePrice: this.normalizeOptionalPrice(this.selectedBoxForm.purchasePrice),
      weightGrams: Math.max(1, Math.floor(Number(this.selectedBoxForm.weightGrams) || 1)),
      imageUrl: this.normalizeImageUrl(this.selectedBoxForm.imageUrl),
      showOnFrontOffice: this.selectedBoxForm.showOnFrontOffice,
    };

    if (!payload.name) {
      return;
    }

    const boxId = this.selectedBoxId;
    const box = this.selectedBox;
    const images = [...(box?.images ?? [])];
    const completeImages = [...(box?.completeImages ?? [])];

    await this.runAction(async () => {
      await this.adminMockService.updateBox(boxId, payload);

      const orderUpdates: Promise<unknown>[] = [];
      if (images.length > 0) {
        orderUpdates.push(
          this.adminMockService.updateBoxImagesOrder(boxId, images),
        );
      }
      if (completeImages.length > 0) {
        orderUpdates.push(
          this.adminMockService.updateBoxCompleteImagesOrder(
            boxId,
            completeImages,
          ),
        );
      }
      await Promise.all(orderUpdates);
    });
  }

  shippingRatesFor(
    carrier: ShippingRate['carrier'],
    deliveryMode: ShippingRate['deliveryMode'],
  ) {
    return this.shippingRates.filter(
      (rate) => rate.carrier === carrier && rate.deliveryMode === deliveryMode,
    );
  }

  onNewBoxImagesSelected(event: Event) {
    this.newBoxImageFiles = this.getFilesFromInput(event);
  }

  onSelectedBoxImagesSelected(event: Event) {
    this.selectedBoxImageFiles = this.getFilesFromInput(event);
  }

  onSelectedBoxCompleteImagesSelected(event: Event) {
    this.selectedBoxCompleteImageFiles = this.getFilesFromInput(event);
  }

  async uploadSelectedBoxImages() {
    if (!this.selectedBoxId || this.selectedBoxImageFiles.length === 0) {
      return;
    }

    const boxId = this.selectedBoxId;
    this.errorMessage = '';
    this.isLoading = true;
    try {
      await this.adminMockService.uploadBoxImages(
        boxId,
        this.selectedBoxImageFiles,
      );
      this.selectedBoxImageFiles = [];
      await this.refreshAll();
      this.selectBox(boxId);
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.isLoading = false;
    }
  }

  setSelectedBoxImageOrder(imageIndex: number, order: number) {
    const box = this.selectedBox;
    if (!box) return;
    this.reorderSelectedBoxImages(box.images, imageIndex, order, 'images');
  }

  async uploadSelectedBoxCompleteImages() {
    if (!this.selectedBoxId || this.selectedBoxCompleteImageFiles.length === 0) return;
    const boxId = this.selectedBoxId;
    this.errorMessage = '';
    this.isLoading = true;
    try {
      await this.adminMockService.uploadBoxCompleteImages(boxId, this.selectedBoxCompleteImageFiles);
      this.selectedBoxCompleteImageFiles = [];
      await this.refreshAll();
      this.selectBox(boxId);
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.isLoading = false;
    }
  }

  setSelectedBoxCompleteImageOrder(imageIndex: number, order: number) {
    const box = this.selectedBox;
    if (!box) return;
    this.reorderSelectedBoxImages(
      box.completeImages,
      imageIndex,
      order,
      'completeImages',
    );
  }

  private reorderSelectedBoxImages(
    source: AdminBoxImage[],
    imageIndex: number,
    order: number,
    field: 'images' | 'completeImages',
  ) {
    const targetIndex = Math.min(
      source.length - 1,
      Math.max(0, Math.floor(Number(order) || 1) - 1),
    );
    if (targetIndex === imageIndex) return;
    const images = [...source];
    const [image] = images.splice(imageIndex, 1);
    images.splice(targetIndex, 0, image);
    this.replaceSelectedBoxImages(
      images.map((item, sortOrder) => ({ ...item, sortOrder })),
      field,
    );
  }

  async deleteSelectedBoxCompleteImage(image: AdminBoxImage) {
    const box = this.selectedBox;
    if (!box) return;
    await this.runAction(() => this.adminMockService.deleteBoxCompleteImage(box.id, image));
    this.selectBox(box.id);
  }

  async deleteSelectedBoxImage(image: AdminBoxImage) {
    const box = this.selectedBox;
    if (!box) {
      return;
    }

    await this.runAction(() =>
      this.adminMockService.deleteBoxImage(box.id, image),
    );
    this.selectBox(box.id);
  }

  async deleteBox(boxId: string) {
    await this.runAction(() => this.adminMockService.deleteBox(boxId));

    if (this.selectedBoxId === boxId) {
      if (this.boxes.length > 0) {
        this.selectBox(this.boxes[0].id);
      } else {
        this.selectedBoxId = null;
        this.selectedBoxForm = {
          name: '',
          description: '',
          salePrice: 0,
          purchasePrice: null,
          weightGrams: 1,
          imageUrl: '/alien-box.jpeg',
          showOnFrontOffice: false,
        };
      }
    }
  }

  async toggleSelectedBoxFrontOfficeVisibility() {
    const box = this.selectedBox;
    if (!box) {
      return;
    }

    await this.runAction(() =>
      this.adminMockService.updateBox(box.id, {
        name: box.name,
        description: box.description,
        imageUrl: box.imageUrl,
        showOnFrontOffice: !box.showOnFrontOffice,
        salePrice: box.salePrice,
        purchasePrice: box.purchasePrice,
        weightGrams: box.weightGrams,
      }),
    );
    this.selectBox(box.id);
  }

  async addProductToSelectedBox() {
    if (!this.selectedBoxId || !this.addProductId) {
      return;
    }

    await this.runAction(() =>
      this.adminMockService.addProductToBox(this.selectedBoxId!, this.addProductId),
    );
    this.addProductId = '';
  }

  async updateBoxItemQuantity(item: BoxProductLine, value: number) {
    if (!this.selectedBoxId) {
      return;
    }

    const quantity = Math.max(1, Math.floor(Number(value) || 1));
    await this.runAction(() =>
      this.adminMockService.updateBoxItem(this.selectedBoxId!, item.productId, {
        quantity,
      }),
    );
  }

  async removeProductFromSelectedBox(productId: string) {
    if (!this.selectedBoxId) {
      return;
    }

    await this.runAction(() =>
      this.adminMockService.removeProductFromBox(this.selectedBoxId!, productId),
    );
  }

  getProductById(productId: string) {
    return this.products.find((product) => product.id === productId) ?? null;
  }

  getLineCost(item: BoxProductLine) {
    const product = this.getProductById(item.productId);
    if (!product) {
      return 0;
    }
    return this.toMoney(product.purchaseUnitPrice * item.quantity);
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
        const existing = linesByProduct.get(item.productId);

        if (existing) {
          linesByProduct.set(item.productId, {
            ...existing,
            requiredQuantity: existing.requiredQuantity + requiredQuantity,
            purchaseTotal: this.toMoney(existing.purchaseTotal + purchaseTotal),
            saleTotal: 0,
            marginTotal: 0,
          });
        } else {
          linesByProduct.set(item.productId, {
            productId: product.id,
            productName: product.name,
            requiredQuantity,
            purchaseTotal,
            saleTotal: 0,
            marginTotal: 0,
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

  getTotalBoxStock() {
    return this.boxes.reduce((sum, box) => sum + box.stockQuantity, 0);
  }

  async signOut() {
    try {
      await this.authService.signOut();
      await this.router.navigateByUrl('/admin/login');
    } catch (error) {
      this.errorMessage = this.formatError(error);
    }
  }

  private async refreshAll() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      [this.boxes, this.orders, this.shippingRates, this.reviews] = await Promise.all([
        this.adminMockService.getBoxes(),
        this.adminMockService.getOrders(),
        this.adminMockService.getShippingRates(),
        this.adminMockService.getReviews(),
      ]);
      this.products = [];
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.products = [];
      this.boxes = [];
      this.orders = [];
      this.shippingRates = [];
      this.reviews = [];
    } finally {
      this.isLoading = false;
    }

    this.synchronizeRestockTargets();
    if (!this.selectedBoxId && this.boxes.length > 0) {
      this.selectBox(this.boxes[0].id);
    }
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

  private normalizeOptionalPrice(value: number | null) {
    return value === null || value === undefined || value === ('' as unknown as number)
      ? null
      : Math.max(0, this.toMoney(Number(value) || 0));
  }

  private normalizeImageUrl(imageUrl: string) {
    return imageUrl.trim() || '/alien-box.jpeg';
  }

  private getFilesFromInput(event: Event) {
    const input = event.target as HTMLInputElement;
    return Array.from(input.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    );
  }

  private replaceSelectedBoxImages(
    images: AdminBoxImage[],
    imageType: 'images' | 'completeImages',
  ) {
    if (!this.selectedBoxId) {
      return;
    }

    this.boxes = this.boxes.map((box) =>
      box.id === this.selectedBoxId
        ? {
            ...box,
            [imageType]: images,
            ...(imageType === 'images' && images.length > 0
              ? { imageUrl: images[0].url }
              : {}),
          }
        : box,
    );
  }

  private getBoxPurchaseTotal(box: AdminBox) {
    return box.purchasePrice ?? 0;
  }

  private getBoxSaleTotal(box: AdminBox) {
    return box.salePrice;
  }

  private synchronizeRestockTargets() {
    const synchronized: Record<string, number> = {};
    for (const box of this.boxes) {
      synchronized[box.id] = this.getRestockTarget(box.id);
    }
    this.restockTargets = synchronized;
  }

  private async runAction(action: () => Promise<unknown>) {
    this.errorMessage = '';
    this.isLoading = true;
    try {
      await action();
      await this.refreshAll();
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.isLoading = false;
    }
  }

  private formatError(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }
    return 'Une erreur est survenue.';
  }
}
