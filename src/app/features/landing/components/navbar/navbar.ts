import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Logo } from './logo/logo';
import { Links } from './links/links';
import { Burger } from './burger/burger';

interface NavSection {
  name: string;
  route: string;
}

@Component({
  selector: 'navbar',
  // standalone: true,
  imports: [CommonModule, Logo, Links, Burger],
  templateUrl: './navbar.html',
})
export class Navbar {
  sections = signal<NavSection[]>([
    { name: 'Inicio', route: '#' },
    { name: 'Programas', route: '#' },
    { name: 'FAQ', route: '#' },
    { name: 'Contacto', route: '#' }
  ]);

  logoUrl = signal<string>('assets/LogoCuatrovientos.png');
}
