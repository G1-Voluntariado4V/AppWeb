import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscripcionPendiente } from '../../services/coordinador';

@Component({
    selector: 'app-modal-detalle-inscripcion',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="close.emit()">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" 
             (click)="$event.stopPropagation()">
            
            <!-- Header con gradiente -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-blue-200 text-sm font-medium">Solicitud de Inscripción</span>
                        <h2 class="text-2xl font-bold mt-1">{{ inscripcion.titulo_actividad }}</h2>
                    </div>
                    <button (click)="close.emit()" 
                            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-times text-lg"></i>
                    </button>
                </div>
            </div>

            <!-- Contenido en dos columnas -->
            <div class="p-8 overflow-y-auto max-h-[60vh]">
                <div class="grid md:grid-cols-2 gap-8">
                    
                    <!-- Columna izquierda: Voluntario -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <h3 class="font-bold text-gray-900">Datos del Voluntario</h3>
                        </div>
                        
                        <div class="bg-gray-50 rounded-2xl p-5 space-y-4">
                            <!-- Avatar y nombre -->
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                                    {{ inscripcion.nombre_voluntario.charAt(0) }}
                                </div>
                                <div>
                                    <p class="font-bold text-lg text-gray-900">{{ inscripcion.nombre_voluntario }}</p>
                                    <p class="text-sm text-gray-500">{{ inscripcion.email_voluntario || 'Sin email' }}</p>
                                </div>
                            </div>
                            
                            <!-- Fecha de solicitud -->
                            <div class="flex items-center gap-3 text-sm">
                                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <i class="fa-regular fa-clock"></i>
                                </div>
                                <div>
                                    <p class="text-gray-500 text-xs">Fecha de solicitud</p>
                                    <p class="font-medium text-gray-900">{{ formatearFecha(inscripcion.fecha_solicitud) }}</p>
                                </div>
                            </div>

                            <!-- Estado actual -->
                            <div class="flex items-center gap-3 text-sm">
                                <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <i class="fa-solid fa-hourglass-half"></i>
                                </div>
                                <div>
                                    <p class="text-gray-500 text-xs">Estado actual</p>
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                        <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                        {{ inscripcion.estado_solicitud }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna derecha: Actividad -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <i class="fa-solid fa-calendar-check"></i>
                            </div>
                            <h3 class="font-bold text-gray-900">Datos de la Actividad</h3>
                        </div>
                        
                        <div class="bg-gray-50 rounded-2xl p-5 space-y-4">
                            <!-- Título -->
                            <div>
                                <p class="text-gray-500 text-xs mb-1">Actividad</p>
                                <p class="font-bold text-lg text-gray-900">{{ inscripcion.titulo_actividad }}</p>
                            </div>

                            <!-- Organización -->
                            <div class="flex items-center gap-3 text-sm">
                                <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <i class="fa-solid fa-building"></i>
                                </div>
                                <div>
                                    <p class="text-gray-500 text-xs">Organización</p>
                                    <p class="font-medium text-gray-900">{{ inscripcion.organizacion }}</p>
                                </div>
                            </div>

                            <!-- Fecha de actividad -->
                            <div class="flex items-center gap-3 text-sm">
                                <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                    <i class="fa-regular fa-calendar"></i>
                                </div>
                                <div>
                                    <p class="text-gray-500 text-xs">Fecha de la actividad</p>
                                    <p class="font-medium text-gray-900">{{ formatearFecha(inscripcion.fecha_actividad) }}</p>
                                </div>
                            </div>

                            <!-- Descripción si existe -->
                            @if (inscripcion.descripcion_actividad) {
                                <div>
                                    <p class="text-gray-500 text-xs mb-1">Descripción</p>
                                    <p class="text-sm text-gray-700">{{ inscripcion.descripcion_actividad }}</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer con acciones -->
            <div class="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button (click)="close.emit()"
                        class="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Cerrar
                </button>
                
                <div class="flex items-center gap-3">
                    <button (click)="onRechazar()"
                            class="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
                        <i class="fa-solid fa-times"></i>
                        Rechazar
                    </button>
                    <button (click)="onAprobar()"
                            class="px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200">
                        <i class="fa-solid fa-check"></i>
                        Aprobar Inscripción
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
})
export class ModalDetalleInscripcion {
    @Input({ required: true }) inscripcion!: InscripcionPendiente & { descripcion_actividad?: string };
    @Output() close = new EventEmitter<void>();
    @Output() aprobar = new EventEmitter<void>();
    @Output() rechazar = new EventEmitter<void>();

    formatearFecha(fecha: string): string {
        if (!fecha) return '-';
        try {
            const date = new Date(fecha);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return fecha;
        }
    }

    onAprobar() {
        this.aprobar.emit();
    }

    onRechazar() {
        this.rechazar.emit();
    }
}
