import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border-l-4 transform transition-all animate-slide-in-right flex items-start gap-3 bg-white"
             [ngClass]="{
               'border-green-500 text-green-800': toast.type === 'success',
               'border-red-500 text-red-800': toast.type === 'error',
               'border-blue-500 text-blue-800': toast.type === 'info',
               'border-yellow-500 text-yellow-800': toast.type === 'warning'
             }">
          
          <!-- Icono -->
          <div class="flex-shrink-0 mt-0.5">
            @switch (toast.type) {
              @case ('success') { <i class="fa-solid fa-check-circle text-green-500 text-lg"></i> }
              @case ('error') { <i class="fa-solid fa-exclamation-circle text-red-500 text-lg"></i> }
              @case ('warning') { <i class="fa-solid fa-triangle-exclamation text-yellow-500 text-lg"></i> }
              @case ('info') { <i class="fa-solid fa-info-circle text-blue-500 text-lg"></i> }
            }
          </div>

          <!-- Mensaje -->
          <div class="flex-1 text-sm font-medium pr-2">
            {{ toast.message }}
          </div>

          <!-- Botón de cerrar -->
          <button (click)="toastService.remove(toast.id)" class="opacity-50 hover:opacity-100 transition-opacity">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
