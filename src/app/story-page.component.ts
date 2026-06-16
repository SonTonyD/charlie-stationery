import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-story-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './story-page.component.html',
  styleUrl: './story-page.component.css',
})
export class StoryPageComponent {}
