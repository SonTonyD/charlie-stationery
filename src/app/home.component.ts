import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription as SupabaseSubscription } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';
import { AdminMockService } from './admin/admin-mock.service';
import { AdminBox } from './admin/admin.models';
import { CartService } from './cart.service';
import { LegalConsentComponent } from './legal-consent.component';
import { SupabaseAuthService } from './supabase/auth.service';
import { supabase } from './supabase/supabase.client';

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
  imports: [CommonModule, RouterLink, LegalConsentComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  shopVisible = false;
  loadError = '';
  isAuthenticated = false;
  checkoutBoxId: string | null = null;
  pendingCheckoutBoxId: string | null = null;
  legalAccepted = false;
  addedCartBoxId: string | null = null;
  cartItemCount = 0;
  activeUpcomingIndex = 0;
  activeUpcomingRatio = '827 / 422';

  private authSubscription: SupabaseSubscription | null = null;
  private cartSubscription: Subscription | null = null;
  private scrollAnimationFrameId: number | null = null;
  private upcomingIntervalId: number | null = null;

  boxes: BoxItem[] = [];
  upcomingSlides = ['/upcoming_slide_1.jpeg'];
  private upcomingSlideRatios: Record<string, string> = {};
  private nextUpcomingSlideChecked = false;

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
    private readonly ngZone: NgZone,
  ) {}

  async ngOnInit() {
    await this.loadSession();
    this.authSubscription = this.authService.onAuthStateChange((session) => {
      this.isAuthenticated = !!session;
    });
    this.cartItemCount = this.cartService.getTotalQuantity();
    this.cartSubscription = this.cartService.items$.subscribe(() => {
      this.cartItemCount = this.cartService.getTotalQuantity();
    });

    await this.loadFrontOfficeBoxes();
    this.startUpcomingCarousel();
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.cartSubscription?.unsubscribe();
    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
    }
    if (this.upcomingIntervalId !== null) {
      window.clearInterval(this.upcomingIntervalId);
    }
  }

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  selectUpcoming(index: number) {
    this.activeUpcomingIndex = index;
    this.updateUpcomingRatio();
    this.startUpcomingCarousel();
  }

  onUpcomingImageLoad(index: number, event: Event) {
    const image = event.target as HTMLImageElement;
    this.upcomingSlideRatios[this.upcomingSlides[index]] =
      `${image.naturalWidth} / ${image.naturalHeight}`;

    if (index === this.activeUpcomingIndex) {
      this.updateUpcomingRatio();
    }

    this.discoverNextUpcomingSlide(index);
  }

  requestBuyBox(boxId: string) {
    this.pendingCheckoutBoxId = boxId;
    this.legalAccepted = false;
  }

  cancelBuyBox() {
    if (this.checkoutBoxId) {
      return;
    }

    this.pendingCheckoutBoxId = null;
    this.legalAccepted = false;
  }

  async confirmBuyBox() {
    const boxId = this.pendingCheckoutBoxId;
    if (!boxId || !this.legalAccepted || this.checkoutBoxId) {
      return;
    }

    this.loadError = '';
    this.checkoutBoxId = boxId;

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: { boxId, legalAccepted: true },
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
    this.updateHeroScrollAnimation();
  }

  private async loadFrontOfficeBoxes() {
    this.loadError = '';
    try {
      const boxes = await this.adminMockService.getBoxes();
      const frontBoxes = boxes.filter((box) => box.showOnFrontOffice);

      this.boxes = frontBoxes.map((box) => ({
        id: box.id,
        name: box.name,
        description: box.description,
        price: box.salePrice,
        stock: box.stockQuantity,
        image: box.imageUrl || '/alien-box.jpeg',
      }));
    } catch {
      this.boxes = [];
      this.loadError = 'Les box ne sont pas disponibles pour le moment.';
    }
  }

  discoverNextUpcomingSlide(index: number) {
    if (index !== this.upcomingSlides.length - 1 || this.nextUpcomingSlideChecked) {
      return;
    }

    this.nextUpcomingSlideChecked = true;
    const nextNumber = this.upcomingSlides.length + 1;
    const nextUrl = `/upcoming_slide_${nextNumber}.jpeg`;
    const image = new Image();

    image.onload = () => {
      this.ngZone.run(() => {
        this.upcomingSlides = [...this.upcomingSlides, nextUrl];
        this.nextUpcomingSlideChecked = false;
        this.startUpcomingCarousel();
      });
    };
    image.src = nextUrl;
  }

  private startUpcomingCarousel() {
    if (this.upcomingIntervalId !== null) {
      window.clearInterval(this.upcomingIntervalId);
      this.upcomingIntervalId = null;
    }

    if (this.upcomingSlides.length <= 1) {
      this.activeUpcomingIndex = 0;
      this.updateUpcomingRatio();
      return;
    }

    this.upcomingIntervalId = window.setInterval(() => {
      this.ngZone.run(() => {
        this.activeUpcomingIndex =
          (this.activeUpcomingIndex + 1) % this.upcomingSlides.length;
        this.updateUpcomingRatio();
      });
    }, 5000);
  }

  private updateUpcomingRatio() {
    const activeSlide = this.upcomingSlides[this.activeUpcomingIndex];
    this.activeUpcomingRatio =
      this.upcomingSlideRatios[activeSlide] ?? this.activeUpcomingRatio;
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

  private updateHeroScrollAnimation() {
    const hero = document.querySelector('.hero') as HTMLElement | null;
    if (!hero) {
      return;
    }

    if (window.matchMedia('(max-width: 768px)').matches) {
      hero.style.setProperty('--hero-scroll-progress', '0');
      if (!this.shopVisible) {
        this.shopVisible = true;
      }
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
