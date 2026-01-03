import { Component } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonInput, IonIcon, IonText, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, ReactiveFormsModule, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonInput, IonIcon, IonText, IonButton, IonSpinner, IonCard]
})
export class LoginPage {

  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline
    });

    // Crear formulario reactivo con validaciones
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Getter para acceder facil a los controles
  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  // Mostrar/ocultar contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Enviar formulario de login
  async onSubmit() {
    // Validar
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Mostrar loading
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    // Hacer login
    this.authService.login(this.loginForm.value).subscribe({
      next: async (response) => {
        await loading.dismiss();
        this.isLoading = false;
        console.log('Data:', response);

        // Mostrar toast de exito
        const toast = await this.toastCtrl.create({
          message: `¡Bienvenido, ${response.data?.user.fullName}!`,
          duration: 2000,
          position: 'top',
          color: 'success',
          icon: 'checkmark-circle-outline'
        });
        await toast.present();

        // Redirigir al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: async (error) => {
        await loading.dismiss();
        this.isLoading = false

        // Mostrar toast de error
        const toast = await this.toastCtrl.create({
          message: error.error?.message || 'Credenciales incorrectas',
          duration: 2000,
          position: 'top',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
        await toast.present();

        console.error('Error en el login', error);
      }
    });
  }
}
