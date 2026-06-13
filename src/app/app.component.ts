import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LegalFooterComponent } from './legal-footer.component';
import { SiteNavbarComponent } from './site-navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LegalFooterComponent, SiteNavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'charlies-stationery';
}
