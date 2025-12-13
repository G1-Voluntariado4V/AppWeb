export interface BackendUser {
  id_usuario: number;
  google_id: string | null;
  correo: string | null;
  rol: string;
  estado: string;
  token?: string;
}
