import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private fb = inject(FormBuilder);

  selectedRole: 'volunteer' | 'organizer' | null = null;
  registerForm: FormGroup = this.fb.group({});

  // Mock courses for the dropdown (based on CURSO table)
  courses = [
    { id: 1, name: '1º Desarrollo de Aplicaciones Multiplataforma' },
    { id: 2, name: '2º Desarrollo de Aplicaciones Multiplataforma' },
    { id: 3, name: '1º Desarrollo de Aplicaciones Web' },
    { id: 4, name: '2º Desarrollo de Aplicaciones Web' },
    { id: 5, name: '1º Sistemas Microinformáticos y Redes' },
    { id: 6, name: '2º Sistemas Microinformáticos y Redes' },
  ];

  selectRole(role: 'volunteer' | 'organizer') {
    this.selectedRole = role;
    this.initForm();
  }

  initForm() {
    // Regex patterns
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/; // Only letters and spaces
    const phonePattern = /^[0-9+ ]+$/; // Only numbers, spaces, and +

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
        nombre: ['', Validators.required], // Organization names might have numbers, so we keep it simple or use a looser pattern if needed. Usually Org names can have anything.
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

    // Regex to check basic format (DNI or NIE)
    const validFormat = /^([0-9]{8}|[XYZ][0-9]{7})[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(str);

    if (!validFormat) {
      return { pattern: true }; // Return pattern error if format doesn't match
    }

    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    let numberPart = str.slice(0, -1);
    const letterPart = str.slice(-1);

    // Replace NIE prefix with corresponding number
    numberPart = numberPart.replace('X', '0').replace('Y', '1').replace('Z', '2');

    const number = parseInt(numberPart, 10);
    const index = number % 23;
    const expectedLetter = letters.charAt(index);

    if (expectedLetter !== letterPart) {
      return { invalidDniChecksum: true }; // Custom error for invalid letter
    }

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  // ... (previous code)

  async onSubmit() {
    if (this.registerForm.valid) {
      const formValues = this.registerForm.value;
      const firebaseUser = this.authService.getCurrentUser();

      if (!firebaseUser) {
        alert('Error: No se ha detectado autenticación con Google. Vuelve al login.');
        this.router.navigate(['/auth/login']);
        return;
      }

      const googleId = firebaseUser.providerData[0]?.uid || firebaseUser.uid;
      const email = firebaseUser.email;

      const payload = {
        ...formValues,
        role: this.selectedRole,
        google_id: googleId,
        email: email
      };

      try {
        await this.authService.registerUser(payload);
        alert('Registro completado exitosamente.');

        // Redirigir según rol
        if (this.selectedRole === 'volunteer') {
          this.router.navigate(['/voluntario']);
        } else {
          // Organizaciones van a status (Pendiente)
          this.router.navigate(['/auth/status'], { queryParams: { state: 'Pendiente' } });
        }

      } catch (error: any) {
        console.error('Registration error:', error);
        alert('Error al registrar: ' + (error.error?.mensaje || 'Inténtalo de nuevo.'));
      }

    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  goBack() {
    this.selectedRole = null;
    this.registerForm.reset();
  }
}
