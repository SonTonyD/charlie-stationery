import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-consent',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './legal-consent.component.html',
  styleUrl: './legal-consent.component.css',
})
export class LegalConsentComponent {
  @Input() accepted = false;
  @Input() modal = false;
  @Input() busy = false;
  @Output() acceptedChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  updateAccepted(event: Event) {
    this.acceptedChange.emit((event.target as HTMLInputElement).checked);
  }
}
