import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseAuthService } from '../supabase/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly authService: SupabaseAuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async login() {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      await this.authService.signInWithPassword(
        this.email.trim(),
        this.password,
      );

      const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
      await this.router.navigateByUrl(redirectTo || '/admin');
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.isLoading = false;
    }
  }

  private formatError(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }
    return 'Identifiants invalides.';
  }
}
