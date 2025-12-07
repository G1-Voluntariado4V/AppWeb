import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { VoluntarioService } from '../../services/voluntario.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  
  private voluntarioService = inject(VoluntarioService);

  perfil = signal<any>({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    curso: '',
    horasTotales: 0,
    cochePropio: false,
    experiencia: '',
    foto: '' // Aseguramos que existe la propiedad foto
  });

  ngOnInit() {
    this.voluntarioService.getPerfil().subscribe(datos => {
      this.perfil.set({ ...datos }); 
    });
  }

  // --- NUEVA FUNCIÓN PARA PROCESAR LA IMAGEN ---
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    
    if (file) {
      // Validar que sea una imagen (opcional pero recomendable)
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      const reader = new FileReader();
      
      // Cuando el lector termine de leer el archivo...
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        
        // Actualizamos la señal del perfil con la nueva imagen en Base64
        // Esto hace que la vista se actualice automáticamente
        this.perfil.update(current => ({
          ...current,
          foto: base64Image
        }));
      };

      // Leemos el archivo como una URL de datos (Base64)
      reader.readAsDataURL(file);
    }
  }

  guardarCambios() {
    // Al guardar, se enviará todo el objeto perfil, incluida la nueva foto en Base64
    this.voluntarioService.updatePerfil(this.perfil()).subscribe(() => {
      alert('¡Perfil actualizado correctamente!');
    });
  }
}
