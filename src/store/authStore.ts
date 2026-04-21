import { create } from 'zustand';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, initialized: true });
    });
    return unsubscribe;
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      // Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName,
        email,
        photoURL: null,
        createdAt: serverTimestamp(),
      });
      set({ user, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: translateFirebaseError(err) });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      set({ user, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: translateFirebaseError(err) });
      throw err;
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));

function translateFirebaseError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este correo ya está registrado.',
      'auth/invalid-email': 'El formato del correo no es válido.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/user-not-found': 'No existe una cuenta con ese correo.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    };
    return messages[code] ?? 'Ocurrió un error. Inténtalo de nuevo.';
  }
  return 'Ocurrió un error. Inténtalo de nuevo.';
}
