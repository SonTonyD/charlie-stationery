import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

interface BoxItem {
  badge: string;
  title: string;
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
export class HomeComponent implements OnInit {
  shopVisible = false;

  boxes: BoxItem[] = [
    {
      badge: 'Best Seller',
      title: 'Cute Pastel Box',
      description: 'Stickers, washi tapes et carnet pastel.',
      price: 18,
      stock: 23,
      image: '/box1.png',
    },
    {
      badge: 'Nouveaute',
      title: 'Study Girl Box',
      description: 'Organisation et papeterie minimaliste coreenne.',
      price: 29,
      stock: 17,
      image: '/box1.png',
    },
    {
      badge: 'Edition Limitee',
      title: 'Deluxe Kawaii Box',
      description: 'Version premium avec accessoires exclusifs.',
      price: 40,
      stock: 9,
      image: '/box1.png',
    },
  ];

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

  ngOnInit() {
    setInterval(() => {
      this.boxes.forEach((box) => {
        if (box.stock > 5) {
          box.stock--;
        }
      });
    }, 10000);
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
}
