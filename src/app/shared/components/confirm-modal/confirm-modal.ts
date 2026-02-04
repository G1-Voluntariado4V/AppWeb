import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">

          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <h3 class="text-lg font-bold text-gray-900 mb-2">{{ title() }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto">{{ message() }}</p>
          </div>

          <div class="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
            <button (click)="onCancel()"
              class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
              {{ cancelText() }}
            </button>
            <button (click)="onConfirm()"
              class="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all hover:shadow-xl hover:scale-105 active:scale-95">
              {{ confirmText() }}
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
    isOpen = input.required<boolean>();
    title = input<string>('¿Estás seguro?');
    message = input<string>('Esta acción no se puede deshacer.');
    confirmText = input<string>('Eliminar');
    cancelText = input<string>('Cancelar');

    confirm = output<void>();
    cancel = output<void>();

    onConfirm() {
        this.confirm.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
