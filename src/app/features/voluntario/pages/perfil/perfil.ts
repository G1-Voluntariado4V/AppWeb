import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { VoluntarioService } from '../../services/voluntario.service'; // Importamos el servicio

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  
  // Inyectamos el servicio para leer y escribir los datos reales
  private voluntarioService = inject(VoluntarioService);

  // Inicializamos el perfil vacío (se rellenará en el ngOnInit)
  perfil = signal<any>({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    curso: '',
    horasTotales: 0,
    cochePropio: false,
    experiencia: ''
  });

  ngOnInit() {
    // 1. Al entrar, pedimos los datos guardados en el servicio
    this.voluntarioService.getPerfil().subscribe(datos => {
      // Usamos {...datos} para crear una copia y que la reactividad funcione bien
      this.perfil.set({ ...datos }); 
    });
  }

  guardarCambios() {
    // 2. Enviamos los datos modificados al servicio para que se guarden "de verdad"
    this.voluntarioService.updatePerfil(this.perfil()).subscribe(() => {
      alert('¡Perfil actualizado correctamente!');
    });
  }
}
