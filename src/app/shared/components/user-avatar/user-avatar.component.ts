import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de avatar reutilizable.
 * Muestra la foto de perfil guardada en el backend, o un avatar
 * generado con las iniciales del usuario y un gradiente de colores.
 */
@Component({
    selector: 'app-user-avatar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="avatar-container" [style.width.px]="size" [style.height.px]="size">
      @if (photoUrl()) {
        <img 
          [src]="photoUrl()" 
          [alt]="(nombre || '') + ' ' + (apellidos || '')"
          class="avatar-img"
          [style.width.px]="size" 
          [style.height.px]="size"
          (error)="onImageError()"
          loading="lazy"
        />
      } @else {
        <div 
          class="avatar-fallback" 
          [style.width.px]="size" 
          [style.height.px]="size"
          [style.fontSize.px]="size * 0.4"
          [style.background]="gradientBackground">
          {{ iniciales }}
        </div>
      }
    </div>
  `,
    styles: [`
    .avatar-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar-img {
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .avatar-fallback {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class UserAvatarComponent implements OnChanges {
    @Input() email: string | undefined | null = '';
    @Input() nombre: string | undefined | null = '';
    @Input() apellidos: string | undefined | null = '';
    @Input() size: number = 40;
    @Input() photoUrlOverride: string | null | undefined = null; // Foto del backend

    photoUrl = signal<string | null>(null);

    get iniciales(): string {
        const n = (this.nombre || '').trim().charAt(0).toUpperCase();
        const a = (this.apellidos || '').trim().charAt(0).toUpperCase();
        return n + a || 'U';
    }

    get gradientBackground(): string {
        const name = (this.nombre || '') + (this.apellidos || '');
        const colors = this.getGradientColors(name);
        return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['photoUrlOverride']) {
            this.updatePhoto();
        }
    }

    private updatePhoto() {
        // Usar la foto del backend si está disponible
        if (this.photoUrlOverride) {
            this.photoUrl.set(this.photoUrlOverride);
        } else {
            this.photoUrl.set(null);
        }
    }

    onImageError() {
        // Si la imagen falla, mostrar fallback con iniciales
        this.photoUrl.set(null);
    }

    private getGradientColors(name: string): [string, string] {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const gradients: [string, string][] = [
            ['#667eea', '#764ba2'], // Purple
            ['#f093fb', '#f5576c'], // Pink
            ['#4facfe', '#00f2fe'], // Blue
            ['#43e97b', '#38f9d7'], // Green
            ['#fa709a', '#fee140'], // Coral
            ['#a8edea', '#fed6e3'], // Pastel
            ['#ff9a9e', '#fecfef'], // Rose
            ['#6366f1', '#8b5cf6'], // Indigo
            ['#ec4899', '#f43f5e'], // Magenta
            ['#14b8a6', '#06b6d4'], // Teal
        ];

        const index = Math.abs(hash) % gradients.length;
        return gradients[index];
    }
}
