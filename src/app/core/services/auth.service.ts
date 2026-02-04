import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { signInWithPopup, User, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

import { auth, googleProvider } from '../config/firebase.config';
import { environment } from '../../../environments/environment';
import { BackendUser, UserProfile } from '../../shared/models/interfaces/backend-user';

const BACKEND_USER_KEY = 'voluntariado_backend_user';
const GOOGLE_PHOTO_KEY = 'voluntariado_google_photo';
const GOOGLE_EMAIL_KEY = 'voluntariado_google_email';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // undefined = loading, null = not logged in, User = logged in
    private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
    user$ = this.userSubject.asObservable();

    private backendUserSubject = new BehaviorSubject<BackendUser | null>(this.loadBackendUserFromStorage());
    backendUser$ = this.backendUserSubject.asObservable();

    // Signal reactivo para la foto de Google (persistida)
    private googlePhotoSignal = signal<string | null>(this.loadGooglePhotoFromStorage());

    // Signal reactivo para el correo de Google (persistido)
    private googleEmailSignal = signal<string | null>(this.loadGoogleEmailFromStorage());

    // Computed: Perfil unificado para usar en toda la app
    public userProfile = computed<UserProfile>(() => {
        const backendUser = this.backendUserSubject.getValue();
        const googlePhoto = this.googlePhotoSignal();
        const googleEmail = this.googleEmailSignal();

        // Construir nombre completo desde backend o usar correo como fallback
        const nombreBackend = [backendUser?.nombre, backendUser?.apellidos]
            .filter(Boolean)
            .join(' ')
            .trim();

        return {
            nombre: nombreBackend || googleEmail?.split('@')[0] || 'Usuario',
            rol: this.formatRol(backendUser?.rol),
            foto: googlePhoto || backendUser?.img_perfil || null,
            email: googleEmail || backendUser?.correo || undefined
        };
    });

    constructor(private http: HttpClient) {
        // Listen to auth state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.userSubject.next(user);

                // Guardar foto de Google (standard) solo si no tenemos ya una mejor
                if (user.photoURL && !this.loadGooglePhotoFromStorage()) {
                    this.persistGooglePhoto(user.photoURL);
                }

                // Guardar correo de Google
                if (user.email) {
                    this.persistGoogleEmail(user.email);
                }

                const googleId = user.providerData[0]?.uid || user.uid;
                // Drop cached backend user if it belongs to a different Google account
                const cached = this.backendUserSubject.getValue();
                if (cached && cached.google_id !== googleId) {
                    this.clearBackendUser();
                }
            } else {
                this.userSubject.next(null);
                this.clearBackendUser();
            }
        });
    }

    // Getter para la foto de Google
    getGooglePhoto(): string | null {
        return this.googlePhotoSignal();
    }

    // Getter para el correo de Google
    getGoogleEmail(): string | null {
        return this.googleEmailSignal();
    }

    // Formato del rol para mostrar
    private formatRol(rol?: string | null): string {
        if (!rol) return 'Usuario';
        const normalizado = rol.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalizado.includes('coordin')) return 'Coordinador';
        if (normalizado.includes('voluntar')) return 'Voluntario';
        if (normalizado.includes('organiz')) return 'Organización';
        return rol;
    }

    async loginWithGoogle(): Promise<User> {
        try {
            // Necesario para poder usar Google People API
            googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");

            const result = await signInWithPopup(auth, googleProvider);

            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;

            if (accessToken) {
                const photoUrl = await this.getGooglePhotoFromApi(accessToken);


                if (photoUrl) {
                    this.persistGooglePhoto(photoUrl);
                }
            }

            return result.user;
        } catch (error) {
            console.error('Error logging in with Google', error);
            throw error;
        }
    }

    private async getGooglePhotoFromApi(accessToken: string): Promise<string | null> {
        try {
            const res = await fetch(
                "https://people.googleapis.com/v1/people/me?personFields=photos",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const data = await res.json();
            return data?.photos?.[0]?.url || null;
        } catch (error) {
            console.error('Error fetching Google Photo from API', error);
            return null;
        }
    }

    async logout(): Promise<void> {
        try {
            this.clearBackendUser();
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out', error);
            throw error;
        }
    }

    async verifyUser(googleId: string, email: string): Promise<BackendUser> {
        // Recuperar la foto actual (ya sea la de People API o la de cache)
        const photoUrl = this.getGooglePhoto();

        const backendUser = await firstValueFrom(
            this.http.post<BackendUser>(`${environment.apiUrl}/auth/login`, {
                google_id: googleId,
                email,
                foto_url: photoUrl
            })
        );

        this.persistBackendUser(backendUser);

        // Sincronizar foto de Google al backend si existe
        if (photoUrl && backendUser.id_usuario) {
            // Ejecutamos en segundo plano para no bloquear el login
            this.uploadGooglePhotoToBackend(backendUser.id_usuario, photoUrl).then(() => {
                // Opcional: recargar usuario para obtener la nueva URL local si fuera necesario
            });
        }

        return backendUser;
    }

    // Sube la foto de Google al backend simulando un form upload
    private async uploadGooglePhotoToBackend(userId: number, photoUrl: string): Promise<void> {
        try {

            const response = await fetch(photoUrl);
            const blob = await response.blob();

            // Detectar extensión
            let ext = 'jpg';
            if (blob.type === 'image/png') ext = 'png';
            else if (blob.type === 'image/webp') ext = 'webp';

            const file = new File([blob], `google_profile.${ext}`, { type: blob.type });

            const formData = new FormData();
            formData.append('imagen', file);

            await firstValueFrom(
                this.http.post(`${environment.apiUrl}/usuarios/${userId}/imagen`, formData)
            );

        } catch (error) {
            console.error('Error al sincronizar foto de Google:', error);
        }
    }

    async registerUser(userData: any): Promise<any> {
        return firstValueFrom(this.http.post(`${environment.apiUrl}/voluntarios`, userData));
    }

    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    getBackendUserSnapshot(): BackendUser | null {
        return this.backendUserSubject.getValue();
    }

    clearBackendUser(): void {
        this.backendUserSubject.next(null);
        localStorage.removeItem(BACKEND_USER_KEY);
        this.clearGooglePhoto();
        this.clearGoogleEmail();
    }

    private persistBackendUser(user: BackendUser): void {
        this.backendUserSubject.next(user);
        localStorage.setItem(BACKEND_USER_KEY, JSON.stringify(user));
    }

    private loadBackendUserFromStorage(): BackendUser | null {
        const raw = localStorage.getItem(BACKEND_USER_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as BackendUser;
        } catch (error) {
            console.warn('Unable to parse cached backend user', error);
            localStorage.removeItem(BACKEND_USER_KEY);
            return null;
        }
    }

    // Métodos para la foto de Google
    private persistGooglePhoto(photoUrl: string): void {
        this.googlePhotoSignal.set(photoUrl);
        localStorage.setItem(GOOGLE_PHOTO_KEY, photoUrl);
    }

    private loadGooglePhotoFromStorage(): string | null {
        return localStorage.getItem(GOOGLE_PHOTO_KEY);
    }

    private clearGooglePhoto(): void {
        this.googlePhotoSignal.set(null);
        localStorage.removeItem(GOOGLE_PHOTO_KEY);
    }

    // Métodos para el correo de Google
    private persistGoogleEmail(email: string): void {
        this.googleEmailSignal.set(email);
        localStorage.setItem(GOOGLE_EMAIL_KEY, email);
    }

    private loadGoogleEmailFromStorage(): string | null {
        return localStorage.getItem(GOOGLE_EMAIL_KEY);
    }

    private clearGoogleEmail(): void {
        this.googleEmailSignal.set(null);
        localStorage.removeItem(GOOGLE_EMAIL_KEY);
    }

    // Actualizar datos del backend user (para cuando cambie el perfil)
    updateBackendUserData(partialData: Partial<BackendUser>): void {
        const current = this.backendUserSubject.getValue();
        if (current) {
            const updated = { ...current, ...partialData };
            this.persistBackendUser(updated);
        }
    }
}
