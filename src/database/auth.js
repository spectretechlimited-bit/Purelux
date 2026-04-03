import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const watchAuthState = (callback) => onAuthStateChanged(auth, callback);

export const adminSignIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

export const adminSignOut = () => signOut(auth);
