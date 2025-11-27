import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'navbar-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.html',
})
export class Logo {
  logo = input.required<string>();
  logoAlt = input.required<string>();
}
