import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from "@angular/router";


@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  logoUrl = signal<string>('assets/LogoCuatrovientos.png');

  loginWithGoogle() {
    alert('Login with Google');
  }
}
