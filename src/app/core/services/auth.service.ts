import { Injectable } from '@angular/core';
import { signInWithPopup, User, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.config';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // undefined = loading, null = not logged in, User = logged in
    private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
    user$ = this.userSubject.asObservable();

    constructor(private http: HttpClient) {
        // Listen to auth state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.userSubject.next(user);
            } else {
                this.userSubject.next(null);
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
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out', error);
            throw error;
        }
    }

    async verifyUser(googleId: string, email: string): Promise<any> {
        return firstValueFrom(this.http.post(`${environment.apiUrl}/auth/login`, {
            google_id: googleId,
            email: email
        }));
    }

    async registerUser(userData: any): Promise<any> {
        return firstValueFrom(this.http.post(`${environment.apiUrl}/auth/register`, userData));
    }

    getCurrentUser(): User | null {
        return auth.currentUser;
    }
}
