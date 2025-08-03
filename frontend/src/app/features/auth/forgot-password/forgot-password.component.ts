import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Component signals
  protected readonly isLoading = signal(false);
  protected readonly emailSent = signal(false);

  // Form setup
  protected readonly forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);

      const email = this.forgotPasswordForm.get('email')?.value;

      // TODO: Implement actual forgot password API call
      // For now, simulate the process
      setTimeout(() => {
        this.isLoading.set(false);
        this.emailSent.set(true);

        this.snackBar.open('Password reset email sent!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }, 2000);

    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Resend email functionality
   */
  protected resendEmail(): void {
    this.emailSent.set(false);
    // Reset form or trigger resend logic
  }

  /**
   * Check if form field is invalid and touched
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }
}
