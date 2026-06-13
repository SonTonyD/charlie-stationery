import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { CartService } from './cart.service';

@Component({
  selector: 'app-site-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-navbar.component.html',
  styleUrl: './site-navbar.component.css',
})
export class SiteNavbarComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  menuOpen = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.cartItemCount = this.cartService.getTotalQuantity();
    this.subscriptions.add(
      this.cartService.items$.subscribe(() => {
        this.cartItemCount = this.cartService.getTotalQuantity();
      }),
    );
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          this.menuOpen = false;
        }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
