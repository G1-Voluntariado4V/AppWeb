import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
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
  private toastService = inject(ToastService);

  selectedRole: 'volunteer' | 'organizer' | null = null;
  registerForm: FormGroup = this.fb.group({});
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // Cursos - sistema de dos selectores (curso 1º/2º → ciclo)
  allCoursesList = signal<{ id: number; name: string; grado: string; cursoLevel: number; siglas: string }[]>([]);
  availableLevels = signal<number[]>([]); // [1, 2]
  availableCycles = signal<{ id: number; name: string; siglas: string }[]>([]); // Filtered & Deduped cycles
  
  // Signals for UI state
  currentSelectedLevel = signal<number | null>(null);

  ngOnInit() {
    // Suscribirse al estado de autenticación para manejar la recarga de página
    this.authService.user$.subscribe(user => {
      // Un 'undefined' significa que Firebase aún está inicializando, esperamos.
      if (user === undefined) return;

      if (user === null) {
        this.router.navigate(['/auth/login']);
      } else {
        console.log('✅ Sesión recuperada en registro:', user.email);
        // Usuario autenticado, cargamos los cursos
        this.loadCoursesInBackground();
      }
    });
  }

  loadCoursesInBackground() {
    // Agregar timestamp para bypass caché
    const timestamp = new Date().getTime();
    this.http.get<any[]>(`${environment.apiUrl}/catalogos/cursos?t=${timestamp}`).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // Process raw response
          const courses = response.map(c => {
            const abrev = c.abreviacion || '';
            
            // FIX: Usar 'c.nivel' que viene del backend (si existe), sino fallback a 1.
            // La BD tiene un campo 'nivel' explícito que vale 1 o 2.
            const cursoLevel = c.nivel !== undefined ? c.nivel : 1;
            
            // Extraer las siglas quitando el número inicial por si acaso
            const siglas = abrev.replace(/^\d+/, '');

            return {
              id: c.id,
              name: c.nombre,
              grado: c.grado || 'Otro',
              cursoLevel,
              siglas
            };
          });

          this.allCoursesList.set(courses);

          // Extraer niveles de curso únicos (1, 2)
          const levels = [...new Set(courses.map(c => c.cursoLevel))].sort((a, b) => a - b);
          this.availableLevels.set(levels);

          console.log('✅ Cursos cargados correctamente:', {
            total: courses.length,
            levels: levels
          });

          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.log('❌ Error cargando cursos desde API:', err);
      }
    });
  }

  // Cuando cambia el nivel (1 o 2)
  onLevelChange(level: number) {
    this.currentSelectedLevel.set(level);
    
    // 1. Filter ALL courses by Level
    const coursesForLevel = this.allCoursesList().filter(c => c.cursoLevel === level);

    // 2. Deduplicate Cycles (Handle "repeated" cycles in DB)
    // We group by 'siglas' (or name) to ensure only ONE option appears per cycle type.
    const uniqueMap = new Map();
    coursesForLevel.forEach(c => {
        // Use siglas as the unique key for the dropdown option
        if (!uniqueMap.has(c.siglas)) {
            uniqueMap.set(c.siglas, c);
        }
    });

    const uniqueCycles = Array.from(uniqueMap.values()).sort((a, b) => a.siglas.localeCompare(b.siglas));
    this.availableCycles.set(uniqueCycles);

    // Reset the cycle selection in the form because level changed
    this.registerForm.get('id_curso_actual')?.setValue(''); 
    this.cdr.markForCheck();
  }

  // When cycle is selected, find the correct ID
  // Note: The select in HTML will bind directly to formControlName="id_curso_actual".
  // Since 'availableCycles' contains actual course objects (the first one found for that sigla),
  // the ID will be correct IF there are no duplicate IDs for same Level+Sigla.
  // If there ARE duplicates (multiple IDs for 1DAM), this picks one.
  
  formatCycleName(course: { siglas: string; name: string }): string {
    // Quitar el prefijo "1º " o "2º " del nombre si existe
    let cleanName = course.name.replace(/^\d+º?\s*/, '');
    return `${course.siglas} - ${cleanName}`;
  }

  selectRole(role: 'volunteer' | 'organizer') {
    this.selectedRole = role;
    this.errorMessage.set(null);
    // Si es voluntario, recargar cursos para asegurar que tenemos datos actualizados
    if (role === 'volunteer') {
      this.loadCoursesInBackground();
    }
    this.initForm();
    this.cdr.markForCheck();
  }

  initForm() {
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    const phonePattern = /^(\+\d{1,3}\s?)?\d{9}$/;

    if (this.selectedRole === 'volunteer') {
      this.registerForm = this.fb.group({
        dni: ['', [Validators.required, this.dniValidator]],
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(namePattern)]],
        apellidos: ['', [Validators.required, Validators.minLength(2), Validators.pattern(namePattern)]],
        telefono: ['', [Validators.required, Validators.pattern(phonePattern)]],
        fecha_nac: ['', [Validators.required, this.fechaNacValidator]],
        cursoLevel: ['', Validators.required], // Control for Level
        id_curso_actual: ['', Validators.required], // Control for Cycle ID
      });

      // Reset internal state
      this.currentSelectedLevel.set(null);
      this.availableCycles.set([]);
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

  // Validador de fecha de nacimiento (entre 14 y 100 años)
  fechaNacValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const birthDate = new Date(value);
    const today = new Date();

    // Calcular edad
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 14) {
      return { tooYoung: true };
    }
    if (age > 100) {
      return { tooOld: true };
    }
    if (birthDate > today) {
      return { futureDate: true };
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
      this.router.navigate(['/auth/login']);
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

    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/voluntarios`, payload)
    );

    // Los voluntarios van a estado Pendiente (igual que organizaciones)
    this.toastService.success('¡Registro completado! Tu solicitud está pendiente de aprobación.');
    this.router.navigate(['/auth/status'], { queryParams: { state: 'Pendiente' } });
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

    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/organizaciones`, payload)
    );

    // Las organizaciones van a estado Pendiente
    this.toastService.success('¡Registro completado! Tu solicitud está pendiente de aprobación.');
    this.router.navigate(['/auth/status'], { queryParams: { state: 'Pendiente' } });
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
