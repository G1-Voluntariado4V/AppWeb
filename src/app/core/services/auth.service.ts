import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { signInWithPopup, User, signOut, onAuthStateChanged } from 'firebase/auth';

import { auth, googleProvider } from '../config/firebase.config';
import { environment } from '../../../environments/environment';
import { BackendUser } from '../../shared/models/interfaces/backend-user';

const BACKEND_USER_KEY = 'voluntariado_backend_user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // undefined = loading, null = not logged in, User = logged in
    private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
    user$ = this.userSubject.asObservable();

    private backendUserSubject = new BehaviorSubject<BackendUser | null>(this.loadBackendUserFromStorage());
    backendUser$ = this.backendUserSubject.asObservable();

    constructor(private http: HttpClient) {
        // Listen to auth state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.userSubject.next(user);
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

    async loginWithGoogle(): Promise<User> {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('Error logging in with Google', error);
            throw error;
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
        const backendUser = await firstValueFrom(
            this.http.post<BackendUser>(`${environment.apiUrl}/auth/login`, {
                google_id: googleId,
                email
            })
        );

        this.persistBackendUser(backendUser);
        return backendUser;
    }

    async registerUser(userData: any): Promise<any> {
        return firstValueFrom(this.http.post(`${environment.apiUrl}/auth/register`, userData));
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
}
