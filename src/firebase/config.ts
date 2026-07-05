import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Config pública de Firebase (va en el cliente; no es secreta).
const firebaseConfig = {
  apiKey: 'AIzaSyB-ytIOUQlS1TzvIC2x3N2idV9V28iHSw4',
  authDomain: 'app-nia-1f70a.firebaseapp.com',
  projectId: 'app-nia-1f70a',
  storageBucket: 'app-nia-1f70a.firebasestorage.app',
  messagingSenderId: '955875576186',
  appId: '1:955875576186:web:9e0f7868d6434009442ec3',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
