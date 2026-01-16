import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  selectedRole: 'volunteer' | 'organizer' | null = null;
  registerForm: FormGroup = this.fb.group({});
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // Cursos - inicializamos vacío, se cargan desde API
  courses = signal<{ id: number; name: string; displayName: string }[]>([]);

  ngOnInit() {
    // Suscribirse al estado de autenticación para manejar la recarga de página
    this.authService.user$.subscribe(user => {
      // Un 'undefined' significa que Firebase aún está inicializando, esperamos.
      if (user === undefined) return;

      if (user === null) {
        console.warn('⚠️ No hay sesión de Firebase activa, redirigiendo a login...');
        window.location.href = '/auth/login';
      } else {
        console.log('✅ Sesión recuperada en registro:', user.email);
        // Usuario autenticado, cargamos los cursos
        this.loadCoursesInBackground();
      }
    });
  }

  loadCoursesInBackground() {
    this.http.get<any[]>(`${environment.apiUrl}/catalogos/cursos`).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // Ordenar por nombre y luego por nivel
          const sorted = response.sort((a, b) => {
            const nameA = a.nombre || '';
            const nameB = b.nombre || '';
            if (nameA !== nameB) return nameA.localeCompare(nameB);
            return (a.nivel || 0) - (b.nivel || 0);
          });

          // Mapear con formato de visualización
          this.courses.set(sorted.map(c => ({
            id: c.id,
            name: c.nombre,
            displayName: this.formatCourseName(c.nivel, c.nombre)
          })));
          this.cdr.markForCheck();
        }
      },
      error: () => {
        console.log('Error cargando cursos desde API');
      }
    });
  }

  // Formatea el nombre del curso como "1º Desarrollo de Aplicaciones Multiplataforma"
  private formatCourseName(nivel: number, nombre: string): string {
    const ordinal = nivel === 1 ? '1º' : nivel === 2 ? '2º' : `${nivel}º`;
    return `${ordinal} ${nombre}`;
  }

  selectRole(role: 'volunteer' | 'organizer') {
    this.selectedRole = role;
    this.errorMessage.set(null);
    this.initForm();
    this.cdr.markForCheck();
  }

  initForm() {
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    const phonePattern = /^[0-9+ ]+$/;

    if (this.selectedRole === 'volunteer') {
      this.registerForm = this.fb.group({
        dni: ['', [Validators.required, this.dniValidator]],
        nombre: ['', [Validators.required, Validators.pattern(namePattern)]],
        apellidos: ['', [Validators.required, Validators.pattern(namePattern)]],
        telefono: ['', [Validators.required, Validators.pattern(phonePattern)]],
        fecha_nac: ['', Validators.required],
        id_curso_actual: ['', Validators.required],
      });
    } else if (this.selectedRole === 'organizer') {
      this.registerForm = this.fb.group({
        cif: ['', [Validators.required]],
        nombre: ['', Validators.required],
        descripcion: [''],
        direccion: [''],
        sitio_web: [''],
        telefono: ['', [Validators.required, Validators.pattern(phonePattern)]],
      });
    }
  }

  dniValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const str = value.toString().toUpperCase().trim();

    const validFormat = /^([0-9]{8}|[XYZ][0-9]{7})[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(str);
    if (!validFormat) {
      return { pattern: true };
    }

    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    let numberPart = str.slice(0, -1);
    const letterPart = str.slice(-1);

    numberPart = numberPart.replace('X', '0').replace('Y', '1').replace('Z', '2');

    const number = parseInt(numberPart, 10);
    const index = number % 23;
    const expectedLetter = letters.charAt(index);

    if (expectedLetter !== letterPart) {
      return { invalidDniChecksum: true };
    }

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const firebaseUser = this.authService.getCurrentUser();
    if (!firebaseUser) {
      this.errorMessage.set('Error: No hay sesión de Google activa. Vuelve al login.');
      window.location.href = '/auth/login';
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.cdr.markForCheck();

    const googleId = firebaseUser.providerData[0]?.uid || firebaseUser.uid;
    const email = firebaseUser.email;
    const formValues = this.registerForm.value;

    try {
      if (this.selectedRole === 'volunteer') {
        await this.registerVolunteer(formValues, googleId, email);
      } else {
        await this.registerOrganization(formValues, googleId, email);
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      this.handleRegistrationError(error);
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  private async registerVolunteer(formValues: any, googleId: string, email: string | null) {
    const payload = {
      google_id: googleId,
      correo: email,
      nombre: formValues.nombre,
      apellidos: formValues.apellidos,
      dni: formValues.dni.toUpperCase(),
      telefono: String(formValues.telefono),
      fecha_nac: formValues.fecha_nac, // formato YYYY-MM-DD
      id_curso_actual: Number(formValues.id_curso_actual),
      carnet_conducir: false,
      preferencias_ids: [],
      idiomas: []
    };

    console.log('📝 Registrando voluntario:', payload);

    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/voluntarios`, payload)
    );

    console.log('✅ Voluntario registrado');

    // Los voluntarios van a estado Pendiente (igual que organizaciones)
    alert('¡Registro completado! Tu solicitud está pendiente de aprobación por el coordinador.');
    window.location.href = '/auth/status?state=Pendiente';
  }

  private async registerOrganization(formValues: any, googleId: string, email: string | null) {
    const payload = {
      google_id: googleId,
      correo: email,
      nombre: formValues.nombre,
      cif: formValues.cif.toUpperCase(),
      telefono: formValues.telefono,
      descripcion: formValues.descripcion || '',
      direccion: formValues.direccion || '',
      sitio_web: formValues.sitio_web || ''
    };

    console.log('📝 Registrando organización:', payload);

    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/organizaciones`, payload)
    );

    console.log('✅ Organización registrada');

    // Las organizaciones van a estado Pendiente
    alert('¡Registro completado! Tu solicitud está pendiente de aprobación.');
    window.location.href = '/auth/status?state=Pendiente';
  }

  private handleRegistrationError(error: any) {
    console.error('🔥 Error details:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message
    });

    const serverError = error.error;
    let msg = 'Error al registrar. Inténtalo de nuevo.';
    let isDuplicateError = false;

    // Extraer el mensaje de error
    let errorText = '';
    if (serverError) {
      if (serverError.violations && Array.isArray(serverError.violations)) {
        errorText = serverError.violations.map((v: any) => `${v.propertyPath}: ${v.message}`).join('\n');
      } else if (serverError.error) {
        errorText = serverError.error;
      } else if (serverError.mensaje) {
        errorText = serverError.mensaje;
      } else if (serverError.detail) {
        errorText = serverError.detail;
      } else if (typeof serverError === 'string') {
        errorText = serverError;
      }
    }

    const errorLower = errorText.toLowerCase();

    // Detectar errores de duplicados (inglés y español)
    const duplicatePatterns = [
      'duplicate',           // Inglés
      'unique',              // Constraint UNIQUE
      'ya existe',           // Español
      'clave duplicada',     // SQL Server español
      'duplicada',           // General español
      'índice único',        // SQL Server español
      'indice unico',        // Sin tildes
      'uniq_',               // Nombre del índice UNIQUE
      '23000',               // SQLSTATE para violación de constraint
      '2601',                // Código SQL Server para duplicados
    ];

    isDuplicateError = error.status === 409 ||
      duplicatePatterns.some(pattern => errorLower.includes(pattern));

    if (isDuplicateError) {
      // Determinar si es por DNI, correo u otro campo
      if (errorLower.includes('dni') || errorLower.includes('voluntario')) {
        msg = 'Ya existe un usuario registrado con este DNI. Si ya tienes cuenta, intenta iniciar sesión.';
      } else if (errorLower.includes('correo') || errorLower.includes('email')) {
        msg = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      } else if (errorLower.includes('cif') || errorLower.includes('organizacion')) {
        msg = 'Ya existe una organización registrada con este CIF. Intenta iniciar sesión.';
      } else {
        msg = 'Ya existe un usuario con estos datos. Si ya tienes cuenta, intenta iniciar sesión.';
      }
    } else if (errorText) {
      // Mostrar error original solo si no es de duplicados
      msg = errorText.length > 200 ? 'Error del servidor. Inténtalo de nuevo más tarde.' : errorText;
    }

    this.errorMessage.set(msg);
  }

  goBack() {
    this.selectedRole = null;
    this.registerForm.reset();
    this.errorMessage.set(null);
    this.cdr.markForCheck();
  }
}
