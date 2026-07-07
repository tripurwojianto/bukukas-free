import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Check if we have a token in memory or localStorage
      const storedToken = localStorage.getItem('bukukas_access_token');
      const tokenToUse = cachedAccessToken || storedToken;

      if (tokenToUse) {
        if (!cachedAccessToken) {
          cachedAccessToken = tokenToUse;
        }
        if (onAuthSuccess) onAuthSuccess(user, tokenToUse);
      } else if (!isSigningIn) {
        // No token found, trigger failure
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Friendly error handling for typical Firebase constraints
    if (error?.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      throw new Error(
        `Domain "${currentDomain}" belum didaftarkan di Firebase Console.\n\n` +
        `Silakan buka Firebase Console -> Authentication -> Settings -> Authorized Domains, lalu tambahkan "${currentDomain}" agar fitur login Google ini dapat aktif.`
      );
    }
    
    if (error?.code === 'auth/popup-blocked') {
      throw new Error(
        `Popup masuk diblokir oleh browser HP Anda.\n\n` +
        `Silakan izinkan popup untuk situs ini pada pengaturan browser Anda (biasanya di bagian atas kanan layar Chrome/Safari), atau klik ulang tombol login setelah mengizinkan popup.`
      );
    }

    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Proses masuk dibatalkan karena jendela login ditutup.');
    }
    
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get current cached access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Set cached access token manually (e.g. on load or from state)
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
