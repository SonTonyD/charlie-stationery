import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="checkout-result">
      <h1>Merci pour ta commande</h1>
      <p>Ton paiement a bien ete pris en compte.</p>
      <a routerLink="/" class="btn">Retour a l'accueil</a>
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
export class CheckoutSuccessComponent {}
