export interface BackendUser {
  id_usuario: number;
  google_id: string | null;
  correo: string | null;
  rol: string;
  estado: string;
  token?: string;

  // Datos del perfil (vienen del backend según el rol)
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  img_perfil?: string | null;

  // Específicos de Voluntario
  dni?: string | null;
  curso?: string | null;
  carnet_conducir?: boolean;

  // Específicos de Organización
  cif?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  sitio_web?: string | null;
}

// Interfaz para el perfil de usuario en la UI (usada en sidebar y layouts)
export interface UserProfile {
  nombre: string;
  rol: string;
  foto: string | null;
  email?: string;
}
