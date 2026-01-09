import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { VoluntarioService } from '../../services/voluntario.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  
  private voluntarioService = inject(VoluntarioService);
  private authService = inject(AuthService);

  // Signal local para edición
  perfilEditable = signal<any>({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    curso: '',
    horasTotales: 0,
    cochePropio: false,
    experiencia: '',
    foto: ''
  });

  // Computed para mostrar la foto de Google con prioridad
  perfil = computed(() => {
    const datos = this.perfilEditable();
    const googlePhoto = this.authService.getGooglePhoto();
    
    return {
      ...datos,
      // PRIORIDAD: Google photo > foto subida > Backend photo
      foto: googlePhoto || datos.foto
    };
  });

  ngOnInit() {
    // Cargar datos del servicio
    const datos = this.voluntarioService.perfilSignal();
    this.perfilEditable.set({ ...datos }); 
  }

  // --- FUNCIÓN PARA PROCESAR LA IMAGEN ---
  // Nota: La foto de Google siempre tendrá prioridad, esta solo se usa si no hay foto de Google
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.perfilEditable.update(current => ({
          ...current,
          foto: base64Image
        }));
      };

      reader.readAsDataURL(file);
    }
  }

  guardarCambios() {
    // Al guardar, se enviará todo el objeto perfil
    this.voluntarioService.updatePerfil(this.perfilEditable()).subscribe(() => {
      alert('¡Perfil actualizado correctamente!');
    });
  }
}
