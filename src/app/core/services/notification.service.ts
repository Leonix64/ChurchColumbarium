import { Injectable } from '@angular/core';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) { }

  async success(message: string, duration = 2000) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  async error(message: string, duration = 3000) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  async confirm(
    header: string,
    message: string,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: [
          { text: cancelText, role: 'cancel', handler: () => resolve(false) },
          { text: confirmText, handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  async loading(message = 'Cargando...') {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }
}
