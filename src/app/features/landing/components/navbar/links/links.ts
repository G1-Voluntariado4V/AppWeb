import { Component, input } from '@angular/core';
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
export class Links {
  sections = input<NavSection[]>([]);
  activeSection = input<string>('');
}
