import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { environment } from "../../../environments/environment";

// Initialize Firebase
const app = initializeApp(environment.firebase);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
