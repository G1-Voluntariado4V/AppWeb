import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NavSection {
  name: string;
  route: string;
}

@Component({
  selector: 'navbar-burger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './burger.html',
  styleUrl: './burger.css'
})
export class Burger {
  sections = input<NavSection[]>([]);
  isOpen = signal(false);
  menuStateChanged = output<boolean>();

  toggleMenu(): void {
    this.isOpen.update(state => !state);
    this.menuStateChanged.emit(this.isOpen());
  }

  closeMenu(): void {
    this.isOpen.set(false);
    this.menuStateChanged.emit(false);
  }
}
