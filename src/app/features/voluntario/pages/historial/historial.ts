import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { VoluntarioService } from '../../services/voluntario.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial.html',
})
export class Historial implements OnInit {
  
  private route = inject(ActivatedRoute);
  private voluntarioService = inject(VoluntarioService);

  menuAbierto = signal(false);
  filtroActual = signal<string>('Todos');

  actividades = signal<any[]>([]);

  // AQUÍ ESTÁ EL CAMBIO IMPORTANTE:
  actividadesVisibles = computed(() => {
    const filtro = this.filtroActual();
    const lista = this.actividades();

    if (filtro === 'Todos') {
      return lista;
    }

    // NUEVO: Si el filtro es 'Activas', mostramos Aceptadas Y Pendientes
    if (filtro === 'Activas') {
      return lista.filter(act => act.estado === 'Aceptada' || act.estado === 'Pendiente');
    }

    // Para el resto de filtros individuales (Finalizada, Cancelada...)
    return lista.filter(act => act.estado === filtro);
  });

  ngOnInit() {
    const datosAlDia = this.voluntarioService.getActividades();
    this.actividades.set(datosAlDia);

    this.route.queryParams.subscribe(params => {
      if (params['filtro']) {
        this.seleccionarFiltro(params['filtro']);
      }
    });
  }

  toggleMenu() {
    this.menuAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: string) {
    this.filtroActual.set(estado);
    this.menuAbierto.set(false);
  }

  getClassEstado(estado: string): string {
    switch (estado) {
      case 'Aceptada': return 'bg-green-100 text-green-700 border-green-200';
      case 'Finalizada': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Pendiente': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Rechazada': return 'bg-red-50 text-red-600 border-red-100';
      case 'Cancelada': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  }
}