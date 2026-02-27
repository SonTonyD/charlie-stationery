import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  shopVisible = false;

  boxes = [
    {
      badge: 'Best Seller',
      title: '🎀 Cute Pastel Box',
      description: 'Stickers, washi tapes et carnet pastel.',
      price: 18,
      stock: 23,
      image: '/box1.png',
    },
    {
      badge: 'Nouveauté',
      title: '📓 Study Girl Box',
      description: 'Organisation & papeterie minimaliste coréenne.',
      price: 29,
      stock: 17,
      image: '/box1.png',
    },
    {
      badge: 'Édition Limitée',
      title: '💖 Deluxe Kawaii Box',
      description: 'Version premium avec accessoires exclusifs.',
      price: 40,
      stock: 9,
      image: '/box1.png',
    },
  ];

  reviews = [
    {
      text: 'Qualité incroyable, livraison rapide, je recommande !',
      author: 'Clara M.',
    },
    { text: 'Les stickers sont trop mignons 😭', author: 'Emma L.' },
    { text: 'Parfait pour offrir.', author: 'Sarah T.' },
    { text: 'Très belle surprise.', author: 'Julie R.' },
  ];

  faqs = [
    {
      question: 'Les produits sont-ils authentiques ?',
      answer: 'Oui, importés directement de Corée du Sud.',
      open: false,
    },
    {
      question: 'Puis-je offrir une box ?',
      answer: 'Oui, parfait pour un cadeau.',
      open: false,
    },
    {
      question: 'Quels sont les délais ?',
      answer: 'Livraison sous 48-72h en France.',
      open: false,
    },
  ];

  ngOnInit() {
    // Fake stock reduction
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

  // HERO animation on scroll
  @HostListener('window:scroll')
  onScroll() {
    const progress = Math.min(1, window.scrollY / window.innerHeight);

    const hero = document.querySelector('.hero') as HTMLElement;
    const shop = document.querySelector('#shop') as HTMLElement;

    if (!hero) return;

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

  // Ripple effect
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');

    ripple.style.left = event.clientX + 'px';
    ripple.style.top = event.clientY + 'px';
    ripple.style.border = '2px solid rgba(200,182,255,0.4)';

    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 800);
  }
}
