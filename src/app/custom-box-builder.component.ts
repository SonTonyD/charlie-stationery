import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CustomBoxProduct {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  image: string;
  isMysteryChoice?: boolean;
}

interface CustomBoxStep {
  title: string;
  stepPrice: number;
  products: CustomBoxProduct[];
}

@Component({
  selector: 'app-custom-box-builder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './custom-box-builder.component.html',
  styleUrl: './custom-box-builder.component.css',
})
export class CustomBoxBuilderComponent {
  readonly fixedPrice = 30;

  readonly steps: CustomBoxStep[] = [
    {
      title: 'Etape 1: Choisis ton carnet',
      stepPrice: 5,
      products: [
        {
          id: 'notebook-pastel',
          name: 'Carnet Pastel',
          description:
            'Carnet doux et leger, ideal pour les notes quotidiennes.',
          quantity: 30,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-grid',
          name: 'Carnet Quadrille',
          description:
            'Pages quadrillees pour le bullet journal et les etudes.',
          quantity: 20,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-vintage',
          name: 'Carnet Vintage',
          description: 'Couverture kraft avec style minimaliste.',
          quantity: 0,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-floral',
          name: 'Carnet Floral',
          description:
            'Couverture fleurie et pages lignées pour ecrire avec style.',
          quantity: 10,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-black',
          name: 'Carnet Black Edition',
          description: 'Design sobre noir mat, parfait pour un look premium.',
          quantity: 15,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-dot',
          name: 'Carnet Pointille',
          description:
            'Pages a points ideales pour le journaling et les croquis.',
          quantity: 0,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-korean',
          name: 'Carnet Korean Mood',
          description:
            'Carnet tendance avec couverture pastel inspiree K-style.',
          quantity: 25,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-travel',
          name: 'Carnet Travel Notes',
          description:
            'Format pratique pour noter idees, sorties et souvenirs.',
          quantity: 12,
          price: 5,
          image: '/box1.png',
        },
      ],
    },
    {
      title: 'Etape 2: Choisis ton accessoire premium',
      stepPrice: 15,
      products: [
        {
          id: 'kit-journal',
          name: 'Kit Journal Premium',
          description: 'Set complet pour personnaliser tes pages.',
          quantity: 20,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-washi',
          name: 'Pack Washi Deluxe',
          description: 'Washi tapes haut de gamme et motifs exclusifs.',
          quantity: 30,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-stickers',
          name: 'Album Stickers Collector',
          description: 'Selection premium de stickers coreens.',
          quantity: 0,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-calligraphy',
          name: 'Kit Calligraphie Debutant',
          description: 'Plumes, guide et accessoires pour lettering creatif.',
          quantity: 10,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-photo-cards',
          name: 'Kit Photo Cards Deco',
          description:
            'Mini cartes deco et pinces pour personnaliser ton carnet.',
          quantity: 15,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-stamp',
          name: 'Coffret Tampons Creatifs',
          description:
            'Tampons alphabet et icones pour une mise en page unique.',
          quantity: 0,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-aesthetic',
          name: 'Pack Aesthetic Premium',
          description: 'Selection tendance de deco papier, tags et inserts.',
          quantity: 25,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-organizer',
          name: 'Kit Organisation Planner',
          description:
            'Outils premium pour structurer semaines, objectifs et taches.',
          quantity: 12,
          price: 15,
          image: '/box1.png',
        },
      ],
    },
    {
      title: 'Etape 3: Choisis ta touche finale',
      stepPrice: 10,
      products: [
        {
          id: 'pens-gel',
          name: 'Set Stylos Gel',
          description: 'Couleurs vives et ecriture fluide.',
          quantity: 30,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'markers-soft',
          name: 'Set Surligneurs Soft',
          description: 'Palette pastel pour un rendu clean.',
          quantity: 20,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'planner-tools',
          name: 'Outils Planner',
          description: 'Regle, pochoirs et accessoires de precision.',
          quantity: 10,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'pens-blackline',
          name: 'Set Fineliners Blackline',
          description: 'Pointes fines pour titres, contours et details nets.',
          quantity: 15,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'eraser-cute',
          name: 'Pack Gomme Cute',
          description:
            'Petites gommes design pour corriger sans abimer le papier.',
          quantity: 0,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'clips-gold',
          name: 'Clips Dores Premium',
          description: 'Clips metalliques elegants pour marquer tes pages.',
          quantity: 25,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'sticky-tabs',
          name: 'Onglets Adhesifs Color',
          description:
            'Onglets repositionnables pour organiser ton carnet facilement.',
          quantity: 0,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'mini-ruler-set',
          name: 'Mini Set Regle & Pochoirs',
          description:
            'Petit kit pratique pour tracer et decorer avec precision.',
          quantity: 12,
          price: 10,
          image: '/box1.png',
        },
      ],
    },
  ];

  currentStepIndex = 0;
  readonly mysteryChoicesByStep: CustomBoxProduct[] = this.steps.map(
    (step, index) => ({
      id: `mystery-step-${index + 1}`,
      name: 'Choix mystere',
      description:
        'Laissez-nous vous surprendre avec un article présent dans la liste.',
      quantity: 1,
      price: step.stepPrice,
      image: '/box1.png',
      isMysteryChoice: true,
    }),
  );

  selectedByStep: Array<CustomBoxProduct | null> = Array.from(
    { length: this.steps.length },
    () => null,
  );

  get currentStep() {
    return this.steps[this.currentStepIndex];
  }

  get currentStepProducts() {
    return [
      ...this.currentStep.products,
      this.mysteryChoicesByStep[this.currentStepIndex],
    ];
  }

  get isLastStep() {
    return this.currentStepIndex === this.steps.length - 1;
  }

  get completedSteps() {
    return this.selectedByStep.filter(Boolean).length;
  }

  get selectedTotal() {
    return this.selectedByStep.reduce(
      (sum, product) => sum + (product?.price ?? 0),
      0,
    );
  }

  get isConfigurationComplete() {
    return this.completedSteps === this.steps.length;
  }

  get canCheckout() {
    return (
      this.isConfigurationComplete && this.selectedTotal === this.fixedPrice
    );
  }

  get stepAmountSum() {
    return this.steps.reduce((sum, step) => sum + step.stepPrice, 0);
  }

  isSelected(product: CustomBoxProduct) {
    return this.selectedByStep[this.currentStepIndex]?.id === product.id;
  }

  isMysteryChoice(product: CustomBoxProduct) {
    return Boolean(product.isMysteryChoice);
  }

  isOutOfStock(product: CustomBoxProduct) {
    return product.quantity <= 0;
  }

  selectProduct(product: CustomBoxProduct) {
    if (this.isOutOfStock(product)) {
      return;
    }

    this.selectedByStep[this.currentStepIndex] = product;
  }

  goToNextStep() {
    if (!this.selectedByStep[this.currentStepIndex] || this.isLastStep) {
      return;
    }

    this.currentStepIndex += 1;
  }

  goToPreviousStep() {
    if (this.currentStepIndex === 0) {
      return;
    }

    this.currentStepIndex -= 1;
  }

  checkout() {
    if (!this.canCheckout) {
      return;
    }

    alert(`Box personnalisee ajoutee au panier: ${this.fixedPrice}EUR`);
  }
}
