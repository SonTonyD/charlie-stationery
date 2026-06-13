import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription as SupabaseSubscription } from '@supabase/supabase-js';
import { Subscription, filter } from 'rxjs';
import { CartService } from './cart.service';
import { SupabaseAuthService } from './supabase/auth.service';

@Component({
  selector: 'app-site-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-navbar.component.html',
  styleUrl: './site-navbar.component.css',
})
export class SiteNavbarComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  isAuthenticated = false;
  menuOpen = false;

  private readonly subscriptions = new Subscription();
  private authSubscription: SupabaseSubscription | null = null;

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly authService: SupabaseAuthService,
  ) {}

  async ngOnInit() {
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
    await this.loadSession();
    this.authSubscription = this.authService.onAuthStateChange((session) => {
      this.isAuthenticated = !!session;
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  private async loadSession() {
    try {
      this.isAuthenticated = !!(await this.authService.getSession());
    } catch {
      this.isAuthenticated = false;
    }
  }
}
