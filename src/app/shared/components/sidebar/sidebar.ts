import { Component, HostListener, OnInit, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarItem } from '@app/shared/models/interfaces/sidebarItem';

type SidebarUser = {
  nombre?: string;
  rol?: string | { nombre_rol?: string };
  foto?: string | null;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  links = input.required<SidebarItem[]>();
  user = input<SidebarUser | null>(null);
  userName = input<string>(''); // Compatibilidad: se usa si no se pasa user
  userRole = input<string | { nombre_rol?: string }>('');
  userPhoto = input<string>('');
  profileLink = input<SidebarItem | undefined>();

  onLogout = output<void>();

  isOpen = signal<boolean>(true);
  isMobileView = signal<boolean>(false);
  private readonly mobileBreakpoint = 768;
  private openMenus = signal<Set<string>>(new Set());

  ngOnInit() {
    this.syncViewportState();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.syncViewportState();
  }

  trackByRoute = (_: number, item: SidebarItem) => item.route ?? item.label;

  private currentUser() {
    return this.user();
  }

  displayName() {
    return this.currentUser()?.nombre || this.userName() || 'Usuario';
  }

  displayRole() {
    const role = this.currentUser()?.rol ?? this.userRole();
    return typeof role === 'string' ? role || 'Rol' : role?.nombre_rol || 'Rol';
  }

  displayPhoto() {
    return this.currentUser()?.foto || this.userPhoto() || '';
  }

  handleLogout() {
    this.onLogout.emit();
  }

  toggleMenu(label: string) {
    const next = new Set(this.openMenus());
    next.has(label) ? next.delete(label) : next.add(label);
    this.openMenus.set(next);
  }

  isMenuOpen(label: string) {
    return this.openMenus().has(label);
  }

  toggleSidebar() {
    if (this.isMobileView()) {
      this.isOpen.update((open) => !open);
    }
  }

  closeSidebar() {
    if (this.isMobileView()) {
      this.isOpen.set(false);
    }
  }

  private syncViewportState() {
    const mobile = window.innerWidth < this.mobileBreakpoint;
    const wasMobile = this.isMobileView();

    this.isMobileView.set(mobile);

    if (mobile && !wasMobile) {
      this.isOpen.set(false);
    }

    if (!mobile) {
      this.isOpen.set(true);
    }
  }
}
