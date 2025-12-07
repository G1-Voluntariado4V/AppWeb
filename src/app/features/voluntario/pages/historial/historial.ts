import { Component, signal, computed } from '@angular/core'; // <--- IMPORTANTE: añadir computed
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial.html',
})
export class Historial {
  
  // 1. Estado del menú desplegable (Abierto/Cerrado)
  menuAbierto = signal(false);

  // 2. Filtro seleccionado actualmente
  filtroActual = signal<string>('Todos');

  // 3. Lista COMPLETA de actividades (Base de datos)
  actividades = signal([
    {
      id: 1,
      titulo: 'Recogida de Alimentos',
      organizacion: 'Cruz Roja',
      fecha: '12 Ene 2025 - 14 Ene 2025',
      estado: 'Finalizada'
    },
    {
      id: 2,
      titulo: 'Acompañamiento Mayores',
      organizacion: 'Amavir',
      fecha: '20 Feb 2025 - 20 Feb 2025',
      estado: 'En curso'
    },
    {
      id: 3,
      titulo: 'Limpieza Río Arga',
      organizacion: 'Ayuntamiento',
      fecha: '05 Mar 2025',
      estado: 'Cancelada'
    },
    {
      id: 4,
      titulo: 'Banco de Alimentos',
      organizacion: 'Cruz Roja',
      fecha: '10 Mar 2025',
      estado: 'Finalizada'
    }
  ]);

  // 4. Lista COMPUTADA (La que se ve en pantalla)
  // Angular recalcula esto automáticamente si cambia 'actividades' o 'filtroActual'
  actividadesVisibles = computed(() => {
    const filtro = this.filtroActual();
    const lista = this.actividades();

    if (filtro === 'Todos') {
      return lista;
    }
    return lista.filter(act => act.estado === filtro);
  });

  // --- MÉTODOS ---

  toggleMenu() {
    this.menuAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: string) {
    this.filtroActual.set(estado);
    this.menuAbierto.set(false); // Cerramos el menú al elegir
  }

  getClassEstado(estado: string): string {
    switch (estado) {
      case 'Finalizada': return 'bg-green-100 text-green-700 border-green-200';
      case 'En curso': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelada': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}