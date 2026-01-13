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

  // Cursos - inicializamos con datos locales para evitar demora
  courses = signal<{ id: number; name: string }[]>([
    { id: 1, name: '1º DAM' },
    { id: 2, name: '2º DAM' },
    { id: 3, name: '1º DAW' },
    { id: 4, name: '2º DAW' },
    { id: 5, name: '1º SMR' },
    { id: 6, name: '2º SMR' },
  ]);

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
        // Usuario autenticado, cargamos los cursos si no se han cargado
        if (this.courses().length <= 6) { // Si solo tienen los default
          this.loadCoursesInBackground();
        }
      }
    });
  }

  loadCoursesInBackground() {
    this.http.get<any[]>(`${environment.apiUrl}/catalogos/cursos`).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.courses.set(response.map(c => ({ id: c.id, name: c.nombre })));
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Si falla, usamos los cursos por defecto ya cargados
        console.log('Usando cursos por defecto');
      }
    });
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
      telefono: formValues.telefono,
      fecha_nac: formValues.fecha_nac,
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

    // Redirigir al dashboard del voluntario
    alert('¡Registro completado exitosamente!');
    window.location.href = '/voluntario';
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
    const serverError = error.error;
    let msg = 'Error al registrar. Inténtalo de nuevo.';

    if (serverError) {
      if (serverError.violations && Array.isArray(serverError.violations)) {
        msg = serverError.violations.map((v: any) => `${v.propertyPath}: ${v.message}`).join('\n');
      } else if (serverError.error) {
        msg = serverError.error;
      } else if (serverError.mensaje) {
        msg = serverError.mensaje;
      } else if (typeof serverError === 'string') {
        msg = serverError;
      }
    }

    // Casos específicos
    if (error.status === 409 || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('ya existe')) {
      msg = 'Este usuario ya está registrado. Intenta iniciar sesión.';
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
