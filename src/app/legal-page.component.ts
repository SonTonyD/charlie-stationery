import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

export interface LegalSection {
  title: string;
  content: string;
}

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.css',
})
export class LegalPageComponent implements OnInit {
  title = '';
  introduction = '';
  sections: LegalSection[] = [];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit() {
    this.title = this.route.snapshot.data['title'] ?? 'Informations legales';
    this.introduction =
      this.route.snapshot.data['introduction'] ??
      'Cette page doit etre completee avant la mise en ligne.';
    this.sections = this.route.snapshot.data['sections'] ?? [];
  }
}
