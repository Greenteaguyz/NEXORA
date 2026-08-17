import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  submitted = false;

  onSubmit(): void {
    if (!this.email) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.submitted = true;
    }, 400);
  }
}
