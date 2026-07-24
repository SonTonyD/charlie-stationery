import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminMockService } from './admin/admin-mock.service';
import { AdminBox } from './admin/admin.models';
import { CartService } from './cart.service';
import { LegalConsentComponent } from './legal-consent.component';
import { supabase } from './supabase/supabase.client';

interface BoxDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  images: string[];
  completeImages: string[];
  items: { productName: string; quantity: number; price: number }[];
}

@Component({
  selector: 'app-box-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LegalConsentComponent],
  templateUrl: './box-detail.component.html',
  styleUrl: './box-detail.component.css',
})
export class BoxDetailComponent implements OnInit, OnDestroy {
  box: BoxDetail | null = null;
  loadError = '';
  isLoading = true;
  checkoutInProgress = false;
  showLegalConsent = false;
  legalAccepted = false;
  addedToCart = false;
  cartItemCount = 0;
  activeTab: 'info' | 'specs' | 'reviews' = 'info';
  selectedImageIndex = 0;

  private cartSubscription: Subscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly adminMockService: AdminMockService,
    private readonly cartService: CartService,
  ) {}

  async ngOnInit() {
    this.cartItemCount = this.cartService.getTotalQuantity();
    this.cartSubscription = this.cartService.items$.subscribe(() => {
      this.cartItemCount = this.cartService.getTotalQuantity();
    });

    const boxId = this.route.snapshot.paramMap.get('id');
    if (!boxId) {
      this.loadError = 'Box non trouvée';
      this.isLoading = false;
      return;
    }

    await this.loadBoxDetails(boxId);
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  async loadBoxDetails(boxId: string) {
    this.loadError = '';
    this.isLoading = true;

    try {
      const boxes = await this.adminMockService.getBoxes();

      const targetBox = boxes.find((b) => b.id === boxId);
      if (!targetBox) {
        this.loadError = 'Box non trouvée';
        return;
      }

      const items = targetBox.items.map((item) => {
        return {
          productName: 'Produit',
          quantity: item.quantity,
          price: 0,
        };
      });

      const stock = targetBox.stockQuantity;
      const price = targetBox.salePrice;

      this.box = {
        id: targetBox.id,
        name: targetBox.name,
        description: targetBox.description,
        price: price,
        stock: stock,
        image: targetBox.imageUrl || '/alien-box.jpeg',
        images:
          targetBox.images.length > 0
            ? targetBox.images.map((image) => image.url)
            : [targetBox.imageUrl || '/alien-box.jpeg'],
        completeImages: targetBox.completeImages.map((image) => image.url),
        items: items,
      };
      this.selectedImageIndex = 0;
    } catch {
      this.loadError = 'Erreur lors du chargement de la box';
    } finally {
      this.isLoading = false;
    }
  }

  requestBuyBox() {
    this.legalAccepted = false;
    this.showLegalConsent = true;
  }

  cancelBuyBox() {
    if (this.checkoutInProgress) {
      return;
    }

    this.showLegalConsent = false;
    this.legalAccepted = false;
  }

  async confirmBuyBox() {
    if (!this.box || !this.legalAccepted || this.checkoutInProgress) {
      return;
    }

    this.loadError = '';
    this.checkoutInProgress = true;

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: { boxId: this.box.id, legalAccepted: true },
        },
      );

      if (error || !data?.url) {
        this.loadError = 'Le paiement est indisponible pour le moment.';
        return;
      }

      window.location.assign(data.url);
    } catch {
      this.loadError = 'Le paiement est indisponible pour le moment.';
    } finally {
      this.checkoutInProgress = false;
    }
  }

  addToCart() {
    if (!this.box || this.box.stock <= 0) {
      return;
    }

    this.cartService.addItem({
      boxId: this.box.id,
      name: this.box.name,
      description: this.box.description,
      image: this.box.image,
      unitPrice: this.box.price,
    });

    this.addedToCart = true;
    setTimeout(() => {
      this.addedToCart = false;
    }, 1600);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToCart() {
    this.router.navigate(['/panier']);
  }

  setActiveTab(tab: 'info' | 'specs' | 'reviews') {
    this.activeTab = tab;
  }

  selectImage(index: number) {
    if (!this.box || index < 0 || index >= this.box.images.length) {
      return;
    }

    this.selectedImageIndex = index;
  }

  showPreviousImage() {
    if (!this.box || this.box.images.length < 2) {
      return;
    }

    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.box.images.length) %
      this.box.images.length;
  }

  showNextImage() {
    if (!this.box || this.box.images.length < 2) {
      return;
    }

    this.selectedImageIndex =
      (this.selectedImageIndex + 1) % this.box.images.length;
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }
}
