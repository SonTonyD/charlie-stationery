import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from '@supabase/supabase-js';
import { AdminMockService } from './admin/admin-mock.service';
import { AdminBox } from './admin/admin.models';
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

  private authSubscription: Subscription | null = null;

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
    private readonly authService: SupabaseAuthService,
  ) {}

  async ngOnInit() {
    await this.loadSession();
    this.authSubscription = this.authService.onAuthStateChange((session) => {
      this.isAuthenticated = !!session;
    });

    await this.loadFrontOfficeBoxes();
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }

  @HostListener('window:scroll')
  onScroll() {
    const progress = Math.min(1, window.scrollY / window.innerHeight);

    const hero = document.querySelector('.hero') as HTMLElement | null;
    const shop = document.querySelector('#shop') as HTMLElement | null;

    if (!hero) {
      return;
    }

    const eased = 1 - Math.pow(1 - progress, 3);
    hero.style.transform = `translate3d(${eased * 70}vw, 0, 0)`;
    hero.style.opacity = (1 - eased).toString();

    this.shopVisible = progress > 0.2;

    if (shop) {
      const shopProgress = Math.max(0, (progress - 0.15) / 0.55);
      shop.style.opacity = shopProgress.toString();
      shop.style.transform = `translate3d(0, ${(1 - shopProgress) * 18}px, 0)`;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');

    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    ripple.style.border = '2px solid rgba(200,182,255,0.4)';

    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 800);
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
        image: '/box1.png',
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
}
