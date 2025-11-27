import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'landing-inicio',
  imports: [],
  templateUrl: './inicio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  anio = new Date().getFullYear();

}
