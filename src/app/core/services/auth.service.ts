import { Injectable } from '@angular/core';
import { signInWithPopup, User, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    constructor() {
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

    getCurrentUser(): User | null {
        return auth.currentUser;
    }
}
