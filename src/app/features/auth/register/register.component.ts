import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  displayName = '';
  email = '';
  password = '';
  showPassword = false;
  isCreator = false;
  loading = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onDisplayNameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.displayName = target ? target.value : '';
  }

  onEmailChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.email = target ? target.value : '';
  }

  onPasswordChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.password = target ? target.value : '';
  }

  onCreatorToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.isCreator = target ? target.checked : false;
  }

  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (!this.email || !this.displayName) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.register({
      email: this.email.trim(),
      displayName: this.displayName.trim(),
      isCreator: this.isCreator,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (this.isCreator) {
          this.router.navigate(['/studio']);
        } else {
          this.router.navigate(['/catalog']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
