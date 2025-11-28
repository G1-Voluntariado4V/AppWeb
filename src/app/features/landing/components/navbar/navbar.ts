import { Component, signal, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Logo } from './logo/logo';
import { Links } from './links/links';
import { Burger } from './burger/burger';
import gsap from 'gsap';

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
export class Navbar implements AfterViewInit {
  private el = inject(ElementRef);
  sections = signal<NavSection[]>([
    { name: 'Inicio', route: 'Inicio' },
    { name: 'Sobre Nosotros', route: 'sobre-nosotros' },
    { name: 'Sectores', route: 'sectores' },
    { name: 'FAQ', route: 'faq' },
    { name: 'Contacto', route: 'contacto' }
  ]);

  logoUrl = signal<string>('assets/LogoCuatrovientos.png');

  ngAfterViewInit() {
    const nav = this.el.nativeElement.querySelector('nav');
    gsap.from(nav, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  }
}
