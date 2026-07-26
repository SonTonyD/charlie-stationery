import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminMockService } from './admin/admin-mock.service';
import { CartItem } from './cart.service';
import { DeliveryFormComponent } from './delivery-form.component';

@Component({
  selector: 'app-delivery-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DeliveryFormComponent],
  template: `<main class="delivery-page">
    <a routerLink="/" fragment="shop" class="back-link">← Retour à la boutique</a>
    <header><h1>Finaliser ma commande</h1><p>Choisissez votre livraison avant le paiement sécurisé.</p></header>
    @if (errorMessage) { <p class="error">{{ errorMessage }}</p> }
    @if (item) {
      <article class="item"><img [src]="item.image" [alt]="item.name"><div><h2>{{ item.name }}</h2>@if(item.variantName){<p><strong>Variante : {{ item.variantName }}</strong></p>}<p>{{ item.description }}</p></div><strong>{{ item.unitPrice | number:"1.2-2" }} €</strong></article>
      <app-delivery-form [items]="[item]" [itemsTotal]="item.unitPrice" [legalAccepted]="legalAccepted" />
    }
  </main>`,
  styles: [`.delivery-page{width:min(900px,calc(100% - 36px));margin:auto;padding:42px 0 70px}.back-link{color:#6d35ac;font-weight:700;text-decoration:none}header{margin:20px 0}.item{display:grid;grid-template-columns:100px 1fr auto;gap:16px;align-items:center;background:#fff;padding:15px;border-radius:16px;margin-bottom:18px;box-shadow:0 8px 20px #00000012}.item img{width:100px;height:78px;object-fit:cover;border-radius:11px}.item h2{margin:0 0 5px;text-align:left;font-size:1.15rem}.item p{margin:0}.error{color:#b42318;font-weight:700}@media(max-width:600px){.item{grid-template-columns:80px 1fr}.item strong{grid-column:2}.item img{width:80px}}`],
})
export class DeliveryPageComponent implements OnInit {
  item: CartItem | null = null;
  // Le consentement vient de la modale « Acheter maintenant » précédente.
  legalAccepted = true;
  errorMessage = '';
  constructor(private route: ActivatedRoute, private admin: AdminMockService) {}
  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('boxId');
    const variantId = this.route.snapshot.queryParamMap.get('variantId');
    if (!id) { this.errorMessage = 'Aucun article à commander.'; return; }
    try {
      const box = (await this.admin.getBoxes()).find((entry) => entry.id === id);
      if (!box || !box.showOnFrontOffice || box.stockQuantity < 1) throw new Error();
      const variant = box.hasVariants
        ? box.variants.find((entry) => entry.id === variantId)
        : undefined;
      if (box.hasVariants && !variant) throw new Error();
      this.item = {
        cartItemId: `${box.id}:${variant?.id ?? 'default'}`,
        boxId: box.id,
        variantId: variant?.id,
        variantName: variant?.name,
        name: box.name,
        description: box.description,
        image: box.imageUrl,
        unitPrice: variant?.price ?? box.salePrice,
        weightGrams: box.weightGrams,
        quantity: 1,
      };
    } catch { this.errorMessage = 'Cette box n’est plus disponible.'; }
  }
}
