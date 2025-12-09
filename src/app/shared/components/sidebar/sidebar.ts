import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

// 1. Modificamos la interfaz para admitir submenús (children)
export interface SidebarLink {
  label: string;
  route?: string; // Ahora es opcional, porque un padre desplegable puede no tener ruta propia
  icon: string;
  children?: SidebarLink[]; // NUEVO: Lista de sub-enlaces
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  // Eliminamos el styleUrl si no tienes estilos específicos, o lo dejamos si existe.
})
export class Sidebar {
  // Inputs
  links = input.required<SidebarLink[]>();
  userName = input.required<string>();
  userRole = input.required<string>();
  userPhoto = input<string>();

  // Outputs
  onLogout = output<void>();

  // 2. Control de menús abiertos
  // Usamos un Set para guardar los nombres de los menús desplegados.
  // Inicializamos con 'Usuarios' y 'Aprobaciones' para que salgan abiertos por defecto.
  openMenus = signal<Set<string>>(new Set(['Usuarios', 'Aprobaciones']));

  // Método para alternar (abrir/cerrar)
  toggleMenu(label: string) {
    this.openMenus.update(set => {
      const newSet = new Set(set);
      if (newSet.has(label)) {
        newSet.delete(label); // Si está abierto, lo cierra
      } else {
        newSet.add(label); // Si está cerrado, lo abre
      }
      return newSet;
    });
  }

  // Helper para saber si un menú está abierto en el HTML
  isMenuOpen(label: string): boolean {
    return this.openMenus().has(label);
  }
}