import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarLink {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  // Si no usas css específico, puedes quitar el styleUrl
})
export class Sidebar {
  links = input.required<SidebarLink[]>();
  
  // Datos de usuario
  userName = input<string>('Usuario');
  userRole = input<string>('Rol');
  userPhoto = input<string>(''); 

  onLogout = output<void>();

  logout() {
    this.onLogout.emit();
  }
}
