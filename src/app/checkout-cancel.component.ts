import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from './cart.service';

@Component({
  selector: 'app-checkout-cancel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="checkout-result">
      <h1>Paiement annule</h1>
      <p>Aucun paiement n'a ete effectue. Tu peux reprendre ton achat quand tu veux.</p>
      <a routerLink="/" class="btn">Retour aux box</a>
    </main>
  `,
  styles: [
    `
      .checkout-result {
        max-width: 720px;
        margin: 80px auto;
        padding: 32px 20px;
        text-align: center;
      }

      .checkout-result p {
        margin: 16px 0 24px;
      }

      .btn {
        display: inline-block;
        padding: 12px 24px;
        background: var(--primary);
        border-radius: 30px;
        color: #ffffff;
        font-weight: 600;
        text-decoration: none;
      }
    `,
  ],
})
export class CheckoutCancelComponent implements OnInit {
  constructor(private readonly cartService: CartService) {}

  ngOnInit() {
    this.cartService.clearPendingCheckout();
  }
}
