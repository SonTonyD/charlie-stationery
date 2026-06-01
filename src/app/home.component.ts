import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription as SupabaseSubscription } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';
import { AdminMockService } from './admin/admin-mock.service';
import { AdminBox } from './admin/admin.models';
import { CartService } from './cart.service';
import { supabase } from './supabase/supabase.client';
import { SupabaseAuthService } from './supabase/auth.service';

interface BoxItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

interface Review {
  text: string;
  author: string;
}

interface Faq {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  shopVisible = false;
  loadError = '';
  isAuthenticated = false;
  checkoutBoxId: string | null = null;
  addedCartBoxId: string | null = null;
  cartItemCount = 0;

  private readonly baseDevicePixelRatio = window.devicePixelRatio || 1;
  private authSubscription: SupabaseSubscription | null = null;
  private cartSubscription: Subscription | null = null;
  private scrollAnimationFrameId: number | null = null;

  boxes: BoxItem[] = [];

  reviews: Review[] = [
    {
      text: 'Qualite incroyable, livraison rapide, je recommande !',
      author: 'Clara M.',
    },
    { text: 'Les stickers sont trop mignons', author: 'Emma L.' },
    { text: 'Parfait pour offrir.', author: 'Sarah T.' },
    { text: 'Tres belle surprise.', author: 'Julie R.' },
  ];

  faqs: Faq[] = [
    {
      question: 'Les produits sont-ils authentiques ?',
      answer: 'Oui, importes directement de Coree du Sud.',
      open: false,
    },
    {
      question: 'Puis-je offrir une box ?',
      answer: 'Oui, parfait pour un cadeau.',
      open: false,
    },
    {
      question: 'Quels sont les delais ?',
      answer: 'Livraison sous 48-72h en France.',
      open: false,
    },
  ];

  constructor(
    private readonly adminMockService: AdminMockService,
    private readonly cartService: CartService,
    private readonly authService: SupabaseAuthService,
  ) {}

  async ngOnInit() {
    this.updateHeroZoomCompensation();
    await this.loadSession();
    this.authSubscription = this.authService.onAuthStateChange((session) => {
      this.isAuthenticated = !!session;
    });
    this.cartItemCount = this.cartService.getTotalQuantity();
    this.cartSubscription = this.cartService.items$.subscribe(() => {
      this.cartItemCount = this.cartService.getTotalQuantity();
    });

    await this.loadFrontOfficeBoxes();
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.cartSubscription?.unsubscribe();
    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
    }
  }

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  async buyBox(boxId: string) {
    this.loadError = '';
    this.checkoutBoxId = boxId;

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: { boxId },
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
      this.checkoutBoxId = null;
    }
  }

  addToCart(box: BoxItem) {
    if (box.stock <= 0) {
      return;
    }

    this.cartService.addItem({
      boxId: box.id,
      name: box.name,
      description: box.description,
      image: box.image,
      unitPrice: box.price,
    });
    this.addedCartBoxId = box.id;

    setTimeout(() => {
      if (this.addedCartBoxId === box.id) {
        this.addedCartBoxId = null;
      }
    }, 1600);
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.scrollAnimationFrameId !== null) {
      return;
    }

    this.scrollAnimationFrameId = requestAnimationFrame(() => {
      this.scrollAnimationFrameId = null;
      this.updateHeroScrollAnimation();
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.updateHeroZoomCompensation();
    this.updateHeroScrollAnimation();
  }

  private async loadFrontOfficeBoxes() {
    this.loadError = '';
    try {
      const [products, boxes] = await Promise.all([
        this.adminMockService.getProducts(),
        this.adminMockService.getBoxes(),
      ]);
      const productById = new Map(
        products.map((product) => [product.id, product]),
      );
      const frontBoxes = boxes.filter((box) => box.showOnFrontOffice);

      this.boxes = frontBoxes.map((box) => ({
        id: box.id,
        name: box.name,
        description: box.description,
        price: this.getBoxSaleTotal(box),
        stock: this.getBoxAvailableQuantity(box, productById),
        image: box.imageUrl || '/alien-box.jpeg',
      }));
    } catch {
      this.boxes = [];
      this.loadError = 'Les box ne sont pas disponibles pour le moment.';
    }
  }

  private getBoxSaleTotal(box: AdminBox) {
    return this.toMoney(
      box.items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
    );
  }

  private getBoxAvailableQuantity(
    box: AdminBox,
    productById: Map<string, { stockQuantity: number }>,
  ) {
    if (box.items.length === 0) {
      return 0;
    }

    let maxBoxes = Number.POSITIVE_INFINITY;

    for (const item of box.items) {
      const product = productById.get(item.productId);
      const itemCapacity =
        !product || item.quantity <= 0
          ? 0
          : Math.floor(product.stockQuantity / item.quantity);
      maxBoxes = Math.min(maxBoxes, itemCapacity);
    }

    return Number.isFinite(maxBoxes) ? maxBoxes : 0;
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }

  private async loadSession() {
    try {
      const session = await this.authService.getSession();
      this.isAuthenticated = !!session;
    } catch {
      this.isAuthenticated = false;
    }
  }

  private updateHeroZoomCompensation() {
    const hero = document.querySelector('.hero') as HTMLElement | null;
    if (!hero) {
      return;
    }

    const currentDevicePixelRatio = window.devicePixelRatio || this.baseDevicePixelRatio;
    const browserZoom = currentDevicePixelRatio / this.baseDevicePixelRatio;
    const zoomScale = Math.max(0.5, Math.min(2, 1 / browserZoom));

    hero.style.setProperty('--hero-zoom-scale', zoomScale.toString());
  }

  private updateHeroScrollAnimation() {
    const hero = document.querySelector('.hero') as HTMLElement | null;
    if (!hero) {
      return;
    }

    const progress = Math.min(1, window.scrollY / window.innerHeight);
    const eased = 1 - Math.pow(1 - progress, 3);
    const shouldShowShop = progress > 0.2;

    hero.style.setProperty('--hero-scroll-progress', eased.toString());

    if (this.shopVisible !== shouldShowShop) {
      this.shopVisible = shouldShowShop;
    }
  }
}
