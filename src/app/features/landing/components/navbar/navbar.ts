import { Component, signal, ElementRef, AfterViewInit, inject, OnDestroy } from '@angular/core';
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
export class Navbar implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  sections = signal<NavSection[]>([
    { name: 'Inicio', route: 'Inicio' },
    { name: 'Sobre Nosotros', route: 'sobre-nosotros' },
    { name: 'Sectores', route: 'sectores' },
    { name: 'FAQ', route: 'faq' },
    { name: 'Contacto', route: 'contacto' }
  ]);

  logoUrl = signal<string>('assets/LogoCuatrovientos.png');

  activeSection = signal<string>('');

  private visibleSections = new Map<string, IntersectionObserverEntry>();

  private onScroll = () => {
    const isAtBottom = (window.innerHeight + Math.round(window.scrollY)) >= document.documentElement.scrollHeight - 50;
    if (isAtBottom) {
      const lastSection = this.sections()[this.sections().length - 1];
      this.activeSection.set(lastSection.route);
    } else {
      this.determineActiveSection();
    }
  };

  private determineActiveSection() {
    let maxRatio = 0;
    let bestSection = '';

    this.visibleSections.forEach((entry, id) => {
      if (entry.isIntersecting) {
        // We prioritize the section with the largest visible portion relative to the viewport height
        // But intersectionRatio is relative to the target element size.
        // We might want to check which one covers the middle of the screen?
        // Or just stick to simple ratio for now.

        // Let's try finding the one that is closest to the top of the viewport, 
        // but not above it (unless it covers the whole screen).

        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          bestSection = id;
        }
      }
    });

    if (bestSection) {
      this.activeSection.set(bestSection);
    }
  }

  ngAfterViewInit() {
    const nav = this.el.nativeElement.querySelector('nav');
    gsap.from(nav, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });

    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -10% 0px', // Broad detection area
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.visibleSections.set(entry.target.id, entry);
        } else {
          this.visibleSections.delete(entry.target.id);
        }
      });

      // Only determine active section if we are not at the bottom (handled by scroll listener)
      const isAtBottom = (window.innerHeight + Math.round(window.scrollY)) >= document.documentElement.scrollHeight - 50;
      if (!isAtBottom) {
        this.determineActiveSection();
      }
    }, observerOptions);

    this.sections().forEach(section => {
      const element = document.getElementById(section.route);
      if (element) {
        observer.observe(element);
      }
    });

    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
  }
}
