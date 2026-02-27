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
          quantity: 1,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-grid',
          name: 'Carnet Quadrille',
          description:
            'Pages quadrillees pour le bullet journal et les etudes.',
          quantity: 0,
          price: 5,
          image: '/box1.png',
        },
        {
          id: 'notebook-vintage',
          name: 'Carnet Vintage',
          description: 'Couverture kraft avec style minimaliste.',
          quantity: 1,
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
          quantity: 1,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-washi',
          name: 'Pack Washi Deluxe',
          description: 'Washi tapes haut de gamme et motifs exclusifs.',
          quantity: 1,
          price: 15,
          image: '/box1.png',
        },
        {
          id: 'kit-stickers',
          name: 'Album Stickers Collector',
          description: 'Selection premium de stickers coreens.',
          quantity: 1,
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
          quantity: 1,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'markers-soft',
          name: 'Set Surligneurs Soft',
          description: 'Palette pastel pour un rendu clean.',
          quantity: 1,
          price: 10,
          image: '/box1.png',
        },
        {
          id: 'planner-tools',
          name: 'Outils Planner',
          description: 'Regle, pochoirs et accessoires de precision.',
          quantity: 1,
          price: 10,
          image: '/box1.png',
        },
      ],
    },
  ];

  currentStepIndex = 0;
  selectedByStep: Array<CustomBoxProduct | null> = Array.from(
    { length: this.steps.length },
    () => null,
  );

  get currentStep() {
    return this.steps[this.currentStepIndex];
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
