import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin/admin-auth.guard';
import { AdminLoginComponent } from './admin/admin-login.component';
import { AdminComponent } from './admin/admin.component';
import { BoxDetailComponent } from './box-detail.component';
import { CartComponent } from './cart.component';
import { CheckoutCancelComponent } from './checkout-cancel.component';
import { CheckoutSuccessComponent } from './checkout-success.component';
import { CustomBoxBuilderComponent } from './custom-box-builder.component';
import { HomeComponent } from './home.component';
import { LegalPageComponent } from './legal-page.component';
import { StoryPageComponent } from './story-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'notre-histoire', component: StoryPageComponent },
  { path: 'box/:id', component: BoxDetailComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminAuthGuard] },
  { path: 'panier', component: CartComponent },
  { path: 'personnaliser-box', component: CustomBoxBuilderComponent },
  { path: 'checkout/success', component: CheckoutSuccessComponent },
  { path: 'checkout/cancel', component: CheckoutCancelComponent },
  {
    path: 'mentions-legales',
    component: LegalPageComponent,
    data: {
      title: 'Mentions légales',
      introduction:
        'Retrouvez ci-dessous les informations légales relatives au site La Chapétrie.',
      sections: [
        {
          title: 'Identité de l’entreprise',
          content: `
          Nom de la boutique : La Chapétrie
          Statut : micro-entreprise
          Nom du responsable : M. Elodie
          SIRET : 10601018400013
          Adresse : Bron (69500), France
          Email de contact : lachapetrie26@gmail.com
        `,
        },
        {
          title: 'Hébergement du site',
          content: `
          Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.

          Site internet : https://vercel.com
          Contact : support@vercel.com

          Le nom de domaine est enregistré auprès de OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.
          Site internet : https://www.ovhcloud.com
        `,
        },
        {
          title: 'Activité',
          content: `
          La Chapétrie propose des produits de papeterie artisanale, des box de papeterie et des accessoires créatifs à destination des particuliers.
        `,
        },
        {
          title: 'Propriété intellectuelle',
          content: `
          L’ensemble des contenus présents sur le site, notamment les textes, photographies, illustrations, graphismes, logo, éléments visuels et plus généralement tous les éléments composant le site, sont protégés par le droit de la propriété intellectuelle.

          Toute reproduction, représentation, modification, publication, adaptation ou exploitation, totale ou partielle, des éléments du site, par quelque procédé que ce soit, est interdite sans l’autorisation écrite préalable de La Chapétrie.
        `,
        },
        {
          title: 'Données personnelles',
          content: `
          La Chapétrie peut être amenée à collecter des données personnelles dans le cadre de l’utilisation du site, notamment lors d’une commande, d’une demande de contact ou d’une inscription à une newsletter.

          Les données collectées sont utilisées uniquement pour les finalités nécessaires au traitement des demandes, à la gestion des commandes, à la relation client et, le cas échéant, à l’envoi d’informations commerciales si l’utilisateur y a consenti.

          Pour plus d’informations, l’utilisateur est invité à consulter la Politique de confidentialité du site.
        `,
        },
        {
          title: 'Contact',
          content: `
          Pour toute question relative au site ou aux présentes mentions légales, vous pouvez contacter La Chapétrie à l’adresse suivante : lachapetrie26@gmail.com.
        `,
        },
      ],
    },
  },
  {
    path: 'cgv',
    component: LegalPageComponent,
    data: {
      title: 'Conditions générales de vente',
      introduction:
        'Les présentes Conditions Générales de Vente régissent les ventes réalisées sur le site La Chapétrie. Toute commande passée sur le site implique l’acceptation pleine et entière des présentes CGV par le client.',
      sections: [
        {
          title: 'Objet et champ d’application',
          content: `
          Les présentes Conditions Générales de Vente, ci-après les “CGV”, s’appliquent à toutes les ventes réalisées sur le site internet La Chapétrie.

          Le site est édité par La Chapétrie, micro-entreprise représentée par MOURIER Elodie, située à Bron (69500), France.

          SIRET : 10601018400013
          Email : lachapetrie26@gmail.com

          La Chapétrie propose à la vente des box de papeterie fixes, composées de produits de papeterie fabriqués à la main et/ou de produits de papeterie achetés par l’entreprise puis proposés à la revente, ainsi que des produits de papeterie à l’unité fabriqués à la main.
        `,
        },
        {
          title: 'Produits et prix',
          content: `
          Les produits proposés à la vente comprennent des box de papeterie fixes ainsi que des articles de papeterie vendus à l’unité.

          Chaque fiche produit présente les caractéristiques essentielles du produit concerné : description, contenu, prix, modalités de livraison et, lorsque cela est utile, conseils d’utilisation.

          Les photographies présentes sur le site sont fournies à titre illustratif. La Chapétrie s’efforce de présenter les produits le plus fidèlement possible, mais de légères différences de couleur, de rendu ou de présentation peuvent exister selon les écrans, les techniques de fabrication ou les arrivages fournisseurs.

          Les produits proposés peuvent être des créations artisanales fabriquées par La Chapétrie et/ou des produits de papeterie sélectionnés puis revendus par l’entreprise. Les produits vendus sont exclusivement des articles de papeterie. Ils ne sont ni alimentaires, ni cosmétiques, ni médicaux.

          Les prix sont indiqués en euros. La Chapétrie étant une micro-entreprise, la TVA n’est pas applicable conformément à l’article 293 B du Code général des impôts, sous réserve du régime fiscal effectivement applicable à l’entreprise.

          Les prix affichés sur le site ne comprennent pas les frais de livraison, sauf mention contraire. Les frais de livraison sont indiqués au client avant la validation définitive de la commande.

          La Chapétrie se réserve le droit de modifier ses prix à tout moment. Le prix applicable est celui affiché sur le site au moment de la validation de la commande.
        `,
        },
        {
          title: 'Commande et paiement',
          content: `
          Le client sélectionne le ou les produits qu’il souhaite commander, vérifie le contenu de son panier, renseigne ses informations de livraison et procède au paiement.

          Avant validation définitive, le client peut vérifier le détail de sa commande et corriger d’éventuelles erreurs.

          La commande est considérée comme définitive après validation du paiement.

          La Chapétrie se réserve le droit de refuser ou d’annuler une commande en cas de litige antérieur avec le client, de suspicion de fraude, d’erreur manifeste sur le prix ou d’indisponibilité du produit.

          Le paiement s’effectue en ligne par carte bancaire via la solution sécurisée Stripe.

          La Chapétrie ne conserve pas les données complètes de carte bancaire du client. Les transactions sont traitées par le prestataire de paiement sécurisé.

          La commande est expédiée uniquement après validation effective du paiement.
        `,
        },
        {
          title: 'Livraison',
          content: `
          Les livraisons sont effectuées uniquement en France métropolitaine, sauf mention contraire sur le site.

          Les livraisons peuvent être réalisées via La Poste, Mondial Relay ou tout autre transporteur indiqué lors de la commande.

          Les frais de livraison sont à la charge du client. Ils sont indiqués avant la validation définitive de la commande.

          Le délai indicatif de préparation et de livraison est généralement de 2 à 7 jours ouvrés à compter de la validation de la commande, sauf indication différente sur la fiche produit ou circonstances exceptionnelles.

          La Chapétrie s’engage à faire ses meilleurs efforts pour respecter les délais indiqués. En cas de retard important, le client peut contacter le service client à l’adresse suivante : lachapetrie26@gmail.com

          Conformément aux règles applicables à la vente à distance, La Chapétrie reste responsable de la bonne livraison de la commande jusqu’à sa réception par le client.

          En cas de colis perdu, endommagé ou non livré, le client doit contacter La Chapétrie dans les meilleurs délais afin qu’une solution puisse être proposée : nouvel envoi, remboursement ou ouverture d’une réclamation auprès du transporteur.

          Le client est invité à vérifier l’état du colis à sa réception. En cas de colis manifestement abîmé, il est recommandé de prendre des photos et de signaler le problème rapidement au service client.

          Les commandes sont expédiées avec un service de livraison permettant, sauf exception indiquée au client, le suivi de l’acheminement du colis. Un numéro de suivi peut être communiqué au client lorsque le transporteur le permet.

          En cas d’indication de livraison par le transporteur, la commande est considérée comme livrée à l’adresse ou au point relais indiqué par le client, sauf contestation légitime et éléments contraires transmis par le client.

          Le client est responsable de l’exactitude des informations de livraison communiquées lors de la commande. En cas d’erreur dans l’adresse de livraison fournie par le client entraînant un retour du colis ou une impossibilité de livraison, les frais de réexpédition pourront être facturés au client.
        `,
        },
        {
          title: 'Droit de rétractation',
          content: `
          Conformément aux dispositions applicables à la vente à distance, le client consommateur dispose d’un délai de 14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à justifier sa décision.

          Pour exercer ce droit, le client doit notifier sa décision par email à l’adresse suivante : lachapetrie26@gmail.com, en indiquant son nom, son numéro de commande et les produits concernés.

          Le client peut utiliser le modèle de formulaire de rétractation figurant en fin des présentes CGV, mais ce modèle n’est pas obligatoire.

          Les produits doivent être retournés complets, en bon état, non utilisés, dans leur emballage d’origine lorsque cela est possible, et accompagnés des éventuels accessoires ou éléments inclus dans la box.

          La Chapétrie se réserve le droit de refuser le remboursement ou d’appliquer une décote si les produits retournés sont incomplets, abîmés, utilisés ou détériorés au-delà d’une simple vérification normale par le client.

          Les frais de retour sont à la charge du client. Le client doit renvoyer les produits dans un délai de 14 jours suivant la communication de sa décision de rétractation.

          En cas d’exercice valable du droit de rétractation, La Chapétrie rembourse le client dans un délai de 14 jours à compter de la réception des produits retournés ou de la preuve d’expédition fournie par le client.

          Le remboursement est effectué via le même moyen de paiement que celui utilisé lors de la commande, sauf accord contraire entre les parties.

          À ce jour, les box proposées par La Chapétrie sont des box fixes et non personnalisées. Si La Chapétrie propose ultérieurement des produits personnalisés ou réalisés sur demande spécifique du client, ces produits pourront être exclus du droit de rétractation, conformément aux dispositions légales applicables. Cette exclusion sera clairement indiquée sur la fiche produit concernée.
        `,
        },
        {
          title: 'Garanties et responsabilité',
          content: `
          Le client bénéficie des garanties légales applicables, notamment la garantie légale de conformité et la garantie des vices cachés.

          En cas de produit non conforme, défectueux ou ne correspondant pas à la commande, le client doit contacter La Chapétrie à l’adresse suivante : lachapetrie26@gmail.com, en joignant si possible des photos et une description du problème.

          Selon la situation, La Chapétrie pourra proposer un remplacement, un remboursement ou une autre solution adaptée.

          La Chapétrie ne saurait être tenue responsable des dommages résultant d’une mauvaise utilisation des produits par le client.

          La Chapétrie ne saurait également être tenue responsable en cas d’inexécution ou de retard dû à un cas de force majeure, tel que défini par la loi et la jurisprudence françaises.
        `,
        },
        {
          title: 'Litiges',
          content: `
          Pour toute question, réclamation ou demande relative à une commande, le client peut contacter La Chapétrie par email à l’adresse suivante : lachapetrie26@gmail.com, via le formulaire de contact disponible sur le site, ou via Instagram : lachapetrie.

          Les demandes liées au service après-vente doivent être adressées en priorité par email afin d’assurer un suivi efficace.

          La Chapétrie s’efforce de répondre aux demandes dans un délai de 48 heures ouvrées.

          En cas de litige, le client est invité à contacter en priorité La Chapétrie afin de rechercher une solution amiable.

          Conformément aux dispositions du Code de la consommation, le client consommateur peut recourir gratuitement à un médiateur de la consommation en cas de litige non résolu.

          Médiateur désigné : Médiateur de la consommation FEVAD
          Adresse postale : Médiateur de la consommation FEVAD - BP 20015 - 75362 PARIS CEDEX 8
          Site internet du médiateur : https://www.mediateurfevad.fr/

          Les présentes CGV sont soumises au droit français.

          À défaut de résolution amiable, le litige pourra être porté devant les juridictions compétentes conformément au droit applicable.
        `,
        },
      ],
    },
  },
  {
    path: 'politique-confidentialite',
    component: LegalPageComponent,
    data: {
      title: 'Politique de confidentialité',
      introduction:
        'La présente Politique de Confidentialité explique comment La Chapétrie collecte, utilise et protège les données personnelles des utilisateurs et clients du site.',
      sections: [
        {
          title: 'Données collectées',
          content: `
          Le responsable du traitement des données personnelles est La Chapétrie, micro-entreprise représentée par MOURIER Elodie, située à Bron (69500), France.

          SIRET : 10601018400013
          Email : lachapetrie26@gmail.com

          La Chapétrie peut collecter les données suivantes :

          ● nom et prénom ;
          ● adresse email ;
          ● adresse de livraison ;
          ● adresse de facturation si différente ;
          ● numéro de téléphone si nécessaire à la livraison ;
          ● informations relatives à la commande ;
          ● historique des échanges avec le service client ;
          ● données techniques liées à la navigation sur le site, selon les cookies utilisés.

          La Chapétrie ne collecte pas directement les données complètes de carte bancaire. Les paiements sont traités via le prestataire sécurisé Stripe.
        `,
        },
        {
          title: 'Finalités et base légale',
          content: `
          Les données personnelles sont collectées pour les finalités suivantes :

          ● traitement et gestion des commandes ;
          ● paiement des commandes ;
          ● livraison des produits ;
          ● gestion du service client ;
          ● gestion des retours, remboursements et réclamations ;
          ● respect des obligations comptables, fiscales et légales ;
          ● amélioration du site et de l’expérience utilisateur ;
          ● envoi d’emails liés à la commande ;
          ● envoi éventuel de communications commerciales, uniquement si le client y a consenti lorsque cela est nécessaire.

          Les traitements de données réalisés par La Chapétrie reposent sur les bases légales suivantes :

          ● l’exécution du contrat, pour traiter les commandes et livrer les produits ;
          ● le respect d’obligations légales, notamment comptables et fiscales ;
          ● l’intérêt légitime, pour assurer le service client, prévenir les fraudes et améliorer le site ;
          ● le consentement, lorsque celui-ci est requis, notamment pour certaines communications marketing ou certains cookies.
        `,
        },
        {
          title: 'Durée de conservation',
          content: `
          Les données personnelles sont conservées uniquement pendant la durée nécessaire aux finalités pour lesquelles elles sont collectées.

          À titre indicatif :

          ● les données liées aux commandes sont conservées pendant la durée nécessaire à la gestion commerciale, comptable et fiscale ;
          ● les données relatives au service client sont conservées le temps nécessaire au traitement de la demande ;
          ● les données utilisées à des fins de prospection commerciale sont conservées jusqu’au retrait du consentement ou à l’opposition du client ;
          ● les cookies sont conservés selon leur finalité et conformément à la réglementation applicable.
        `,
        },
        {
          title: 'Destinataires des données',
          content: `
          Les données personnelles peuvent être transmises uniquement aux prestataires nécessaires au fonctionnement du service, notamment :

          ● prestataire de paiement, notamment Stripe ;
          ● transporteurs, notamment La Poste ou Mondial Relay ;
          ● prestataire d’hébergement du site ;
          ● prestataires techniques nécessaires au fonctionnement du site ;
          ● administration fiscale ou autorités compétentes lorsque la loi l’exige.

          La Chapétrie ne vend pas les données personnelles de ses clients.

          Certains prestataires utilisés par La Chapétrie peuvent être situés en dehors de l’Union européenne ou traiter des données en dehors de l’Union européenne. Dans ce cas, La Chapétrie veille à ce que ces transferts soient encadrés par des garanties appropriées conformément à la réglementation applicable.
        `,
        },
        {
          title: 'Droits des utilisateurs',
          content: `
          Conformément à la réglementation applicable, le client dispose des droits suivants sur ses données personnelles :

          ● droit d’accès ;
          ● droit de rectification ;
          ● droit d’effacement ;
          ● droit d’opposition ;
          ● droit à la limitation du traitement ;
          ● droit à la portabilité des données ;
          ● droit de retirer son consentement à tout moment lorsque le traitement repose sur le consentement.

          Pour exercer ses droits, le client peut contacter La Chapétrie à l’adresse suivante : lachapetrie26@gmail.com.

          La Chapétrie pourra demander une preuve d’identité si cela est nécessaire pour traiter la demande.

          Le client peut également introduire une réclamation auprès de la Commission Nationale de l’Informatique et des Libertés (CNIL), s’il estime que ses droits ne sont pas respectés.
        `,
        },
        {
          title: 'Cookies',
          content: `
          Le site peut utiliser des cookies nécessaires à son bon fonctionnement, ainsi que des cookies de mesure d’audience ou de marketing si ces outils sont activés.

          Les cookies strictement nécessaires au fonctionnement du site ne nécessitent pas le consentement de l’utilisateur.

          Les cookies non essentiels, notamment les cookies de mesure d’audience non exemptés ou les cookies publicitaires, sont soumis au consentement préalable de l’utilisateur.

          L’utilisateur peut à tout moment gérer ses préférences via le bandeau cookies ou le module de gestion prévu sur le site, si celui-ci est mis en place.
        `,
        },
        {
          title: 'Contact',
          content: `
          Pour toute question relative à la présente Politique de Confidentialité ou pour exercer ses droits, l’utilisateur peut contacter La Chapétrie à l’adresse suivante : lachapetrie26@gmail.com.

          Si La Chapétrie propose une newsletter, l’utilisateur peut s’y inscrire volontairement. L’utilisateur peut se désinscrire à tout moment en cliquant sur le lien de désinscription présent dans les emails ou en contactant La Chapétrie à l’adresse suivante : lachapetrie26@gmail.com.

          La Chapétrie se réserve le droit de modifier la présente Politique de Confidentialité à tout moment afin de l’adapter aux évolutions légales, techniques ou commerciales. La version applicable est celle publiée sur le site au moment de la consultation.
        `,
        },
      ],
    },
  },
  {
    path: 'cgu',
    component: LegalPageComponent,
    data: {
      title: "Conditions générales d'utilisation",
      introduction:
        "Les présentes Conditions Générales d'Utilisation encadrent l'accès et l'utilisation du site La Chapétrie.",
      sections: [
        {
          title: 'Accès au site',
          content: `
          Le site La Chapétrie est accessible gratuitement à tout utilisateur disposant d'un accès à internet. Les frais liés à cet accès restent à la charge de l'utilisateur.

          La Chapétrie peut interrompre temporairement l'accès au site pour des raisons de maintenance, de sécurité ou en cas de problème technique.
        `,
        },
        {
          title: 'Utilisation du site',
          content: `
          L'utilisateur s'engage à utiliser le site de manière loyale, conformément aux lois applicables et aux présentes conditions.

          Toute tentative de perturber le fonctionnement du site, d'accéder sans autorisation à ses systèmes ou d'utiliser son contenu à des fins illicites est interdite.
        `,
        },
        {
          title: 'Contenus et propriété intellectuelle',
          content: `
          Les textes, images, graphismes, logos et autres contenus présents sur le site sont protégés par les règles relatives à la propriété intellectuelle.

          Toute reproduction, modification ou exploitation sans autorisation écrite préalable de La Chapétrie est interdite.
        `,
        },
        {
          title: 'Responsabilité',
          content: `
          La Chapétrie s'efforce de fournir des informations exactes et à jour, sans pouvoir garantir l'absence totale d'erreur ou d'interruption.

          L'utilisateur reste responsable de son équipement, de sa connexion et de l'usage qu'il fait des informations disponibles sur le site.
        `,
        },
        {
          title: 'Données personnelles et contact',
          content: `
          Le traitement des données personnelles est détaillé dans la Politique de confidentialité disponible sur le site.

          Pour toute question concernant les présentes CGU, l'utilisateur peut contacter La Chapétrie à l'adresse suivante : lachapetrie26@gmail.com.
        `,
        },
      ],
    },
  },
  { path: '**', redirectTo: '' },
];
