import { Component, input, ViewChildren, ElementRef, QueryList, signal, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from "@angular/router";

interface NavSection {
  name: string;
  route: string;
}

@Component({
  selector: 'navbar-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './links.html',
})
export class Links implements AfterViewInit {
  sections = input<NavSection[]>([]);
  activeSection = input<string>('');

  @ViewChildren('navLink') navLinks!: QueryList<ElementRef>;

  pillLeft = signal(0);
  pillTop = signal(0);
  pillWidth = signal(0);
  pillHeight = signal(0);
  pillOpacity = signal(0);

  constructor() {
    effect(() => {
      const active = this.activeSection();
      this.updatePill();
    });
  }

  ngAfterViewInit() {
    this.updatePill();
    this.navLinks.changes.subscribe(() => this.updatePill());
  }

  private updatePill() {
    if (!this.navLinks) return;

    const sections = this.sections();
    const active = this.activeSection();
    const index = sections.findIndex(s => s.route === active);

    if (index !== -1) {
      const element = this.navLinks.get(index)?.nativeElement as HTMLElement;
      if (element) {
        this.pillLeft.set(element.offsetLeft);
        this.pillTop.set(element.offsetTop);
        this.pillWidth.set(element.offsetWidth);
        this.pillHeight.set(element.offsetHeight);
        this.pillOpacity.set(1);
      }
    } else {
      this.pillOpacity.set(0);
    }
  }
}
