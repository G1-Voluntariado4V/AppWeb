import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../../core/services/auth.service";


@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [RouterLink, JsonPipe],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  logoUrl = signal<string>('assets/LogoCuatrovientos.png');
  user = signal<any>(null);

  constructor(private authService: AuthService) { }

  async loginWithGoogle() {
    try {
      const user = await this.authService.loginWithGoogle();
      this.user.set(user);
      console.log('User logged in:', user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  logout() {
    this.authService.logout().then(() => {
      this.user.set(null);
    });
  }
}
