# Charlies Stationery

Application Angular 19 de vente de box de papeterie coreenne, avec front office public, personnalisation de box, back office admin, donnees Supabase et checkout Stripe via une Edge Function Supabase.

## Demarrer le projet

```bash
npm install
npm start
```

L'application tourne ensuite sur `http://localhost:4200/`.

Commandes utiles :

```bash
npm run build
npm test
```

## Cartographie rapide

| Zone | Route | Fichiers principaux | Role |
| --- | --- | --- | --- |
| Shell Angular | Toutes | `src/main.ts`, `src/app/app.config.ts`, `src/app/app.component.*` | Bootstrap de l'app, providers Angular, outlet de routing. |
| Accueil / boutique | `/` | `src/app/home.component.ts`, `src/app/home.component.html`, `src/app/home.component.css` | Hero, liste des box disponibles, avis clients, FAQ, CTA sticky, lancement du checkout. |
| Personnalisation de box | `/personnaliser-box` | `src/app/custom-box-builder.component.ts`, `.html`, `.css` | Parcours en plusieurs etapes pour composer une box a prix fixe. |
| Connexion admin | `/admin/login` | `src/app/admin/admin-login.component.ts`, `.html`, `.css` | Formulaire email/mot de passe Supabase et redirection vers le back office. |
| Back office | `/admin` | `src/app/admin/admin.component.ts`, `.html`, `.css` | Gestion produits, box, stocks, simulation de renouvellement et de marge. |
| Paiement reussi | `/checkout/success` | `src/app/checkout-success.component.ts` | Page de confirmation apres retour Stripe. |
| Paiement annule | `/checkout/cancel` | `src/app/checkout-cancel.component.ts` | Page de retour apres annulation Stripe. |
| Route inconnue | `**` | `src/app/app.routes.ts` | Redirige vers l'accueil. |

## Routing

Les routes sont definies dans `src/app/app.routes.ts`.

```ts
{ path: '', component: HomeComponent }
{ path: 'admin/login', component: AdminLoginComponent }
{ path: 'admin', component: AdminComponent, canActivate: [adminAuthGuard] }
{ path: 'personnaliser-box', component: CustomBoxBuilderComponent }
{ path: 'checkout/success', component: CheckoutSuccessComponent }
{ path: 'checkout/cancel', component: CheckoutCancelComponent }
{ path: '**', redirectTo: '' }
```

Le composant racine `src/app/app.component.html` contient uniquement :

```html
<router-outlet />
```

Chaque ecran est donc porte directement par son composant de route.

## Ecrans front office

### Accueil / boutique

Fichiers :

- `src/app/home.component.ts`
- `src/app/home.component.html`
- `src/app/home.component.css`

Ce que l'ecran contient :

- Hero avec image `/hero-image-2.png`.
- Boutons vers la boutique, la personnalisation et, si l'utilisateur est connecte, le back office.
- Section `Nos Box Disponibles`, alimentee par les box Supabase marquees `showOnFrontOffice`.
- Bouton `Acheter`, qui appelle l'Edge Function `create-checkout-session`.
- Avis clients statiques.
- FAQ statique avec ouverture/fermeture locale.
- CTA sticky en bas de page.

Logique importante dans `home.component.ts` :

- `loadFrontOfficeBoxes()` recupere produits + box via `AdminMockService`.
- `buyBox(boxId)` appelle `supabase.functions.invoke('create-checkout-session')`.
- `onScroll()` anime le hero et l'apparition de la boutique.
- `onMouseMove()` cree l'effet visuel de ripple.

### Personnalisation de box

Fichiers :

- `src/app/custom-box-builder.component.ts`
- `src/app/custom-box-builder.component.html`
- `src/app/custom-box-builder.component.css`

Ce que l'ecran contient :

- Parcours en 3 etapes.
- Selection d'un produit par etape.
- Choix mystere ajoute automatiquement a chaque etape.
- Prix final fixe a `30EUR`.
- Boutons etape precedente / suivante / paiement.

Important :

- Les produits de personnalisation sont aujourd'hui codes en dur dans `steps`.
- Le bouton final appelle `checkout()`, qui affiche seulement une alerte locale. Il n'est pas encore relie au paiement Stripe.

## Ecrans admin

### Connexion admin

Fichiers :

- `src/app/admin/admin-login.component.ts`
- `src/app/admin/admin-login.component.html`
- `src/app/admin/admin-login.component.css`

Role :

- Authentification email/mot de passe avec `SupabaseAuthService`.
- Redirection vers `/admin`, ou vers le parametre `redirectTo` si la route protegee a declenche la connexion.

### Back office

Fichiers :

- `src/app/admin/admin.component.ts`
- `src/app/admin/admin.component.html`
- `src/app/admin/admin.component.css`
- `src/app/admin/admin.models.ts`

Onglets visibles :

- `Produits` : creer, modifier, supprimer les produits, gerer prix achat et prix de vente par defaut.
- `Box` : creer une box, modifier nom/description/image, afficher ou masquer du front office, ajouter ou retirer des produits, regler quantites et prix de vente.
- `Stocks` : modifier les stocks produits et voir combien de box sont vendables.
- `Renouvellement` : simuler les quantites a recommander, le cout d'achat, la vente potentielle et la marge.

Logique importante dans `admin.component.ts` :

- `refreshAll()` recharge produits et box depuis Supabase.
- `saveProduct()`, `deleteProduct()`, `updateProductStock()` gerent le referentiel produits.
- `createBox()`, `saveBoxMeta()`, `deleteBox()` gerent les box.
- `addProductToSelectedBox()`, `updateBoxItemQuantity()`, `updateBoxItemSalePrice()` gerent la composition.
- `getStockBoxAvailabilities()` calcule les quantites vendables.
- `getRestockProductLines()` calcule les besoins de reassort.
- `signOut()` deconnecte l'admin.

Protection de l'ecran :

- `src/app/admin/admin-auth.guard.ts` verifie la session Supabase.
- Si aucune session n'est presente, redirection vers `/admin/login?redirectTo=/admin`.

## Donnees et Supabase

### Client Supabase

Fichiers :

- `src/app/supabase/supabase.client.ts`
- `src/environments/environment.ts`

`supabase.client.ts` cree le client Supabase avec `environment.supabaseUrl` et `environment.supabaseAnonKey`.

### Authentification

Fichier :

- `src/app/supabase/auth.service.ts`

Methodes exposees :

- `getSession()`
- `signInWithPassword(email, password)`
- `signOut()`
- `onAuthStateChange(callback)`

### Service donnees admin

Fichier :

- `src/app/admin/admin-mock.service.ts`

Malgre son nom, ce service utilise Supabase. Il centralise les operations sur :

- `products`
- `boxes`
- `box_items`

Il contient aussi un seed de donnees par defaut, insere si la table `products` est vide et qu'une session authentifiee existe.

### Modeles TypeScript

Fichier :

- `src/app/admin/admin.models.ts`

Modeles :

- `AdminProduct`
- `AdminBox`
- `BoxProductLine`

### Schema SQL

Fichier :

- `supabase/schema.sql`

Tables :

- `products` : produit, prix achat, prix vente par defaut, stock.
- `boxes` : box, description, image, visibilite front office.
- `box_items` : composition d'une box, quantite et prix de vente par produit.

RLS :

- Lecture publique pour `anon` et `authenticated`.
- Ecriture reservee aux utilisateurs `authenticated`.

## Paiement Stripe

Fichier :

- `supabase/functions/create-checkout-session/index.ts`

Flux :

1. `HomeComponent.buyBox(boxId)` appelle `supabase.functions.invoke('create-checkout-session')`.
2. L'Edge Function lit la box dans Supabase avec la service role key.
3. Elle verifie que la box existe et que `show_on_front_office` est actif.
4. Elle calcule le prix depuis les lignes `box_items`.
5. Elle cree une session Stripe Checkout.
6. Elle renvoie l'URL Stripe au front.
7. Le front redirige le navigateur vers cette URL.

Variables attendues cote Edge Function :

- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL` optionnelle, par defaut `http://localhost:4200`

## Assets publics

Dossier :

- `public/`

Assets actuellement utilises ou disponibles :

- `hero-image-2.png` : image du hero de l'accueil.
- `alien-box.jpeg` : image par defaut des box.
- `box1.png` : image utilisee dans le builder personnalise.
- `hero-image.png`, `background-image.png`, `background-hero-image.png` : assets disponibles.
- `favicon.ico`.

Dans Angular, ces fichiers sont references depuis la racine publique, par exemple `/alien-box.jpeg`.

## Styles

Styles globaux :

- `src/styles.css`

Styles par ecran :

- `src/app/home.component.css`
- `src/app/custom-box-builder.component.css`
- `src/app/admin/admin.component.css`
- `src/app/admin/admin-login.component.css`
- `src/app/app.component.css`

Chaque composant route possede son CSS local, sauf les pages checkout qui ont leurs styles inline dans le fichier TypeScript.

## Points d'attention

- Le projet utilise des composants Angular standalone, pas de `AppModule`.
- Le back office et l'accueil partagent `AdminMockService` pour lire les produits et box.
- Le nom `AdminMockService` est trompeur : il parle bien a Supabase.
- Le builder personnalise n'est pas encore connecte a Supabase ni a Stripe.
- Certaines chaines visibles contiennent des caracteres accentues mal encodes dans les sources actuelles.
# Livraison, Boxtal et commandes

Le checkout propose quatre tarifs fixes, recalculés côté serveur :

- point relais Mondial Relay ou La Poste : 4,90 € ;
- domicile Mondial Relay ou La Poste : 7,90 €.

Pour activer cette fonctionnalité :

1. Exécuter `supabase/schema.sql` dans l’éditeur SQL Supabase.
2. Créer une application « composant carte » dans l’espace développeur Boxtal,
   puis ajouter ses identifiants aux secrets Supabase sous les noms
   `BOXTAL_MAP_ACCESS_KEY` et `BOXTAL_MAP_SECRET_KEY`. La fonction serveur les
   échange contre un jeton temporaire via `/iam/account-app/token`; la Secret
   Key n'est jamais envoyée au navigateur.
3. Déployer `boxtal-map-token`, `create-checkout-session` et `stripe-webhook`.
4. Dans Stripe, créer un webhook vers
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` pour les
   événements `checkout.session.completed` et `checkout.session.expired`, puis
   enregistrer son secret sous `STRIPE_WEBHOOK_SECRET`.

Les autres secrets requis restent `STRIPE_SECRET_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` et `SITE_URL`. Les commandes payées apparaissent
dans **Back Office → Commandes** ; leur statut peut y être changé manuellement.
