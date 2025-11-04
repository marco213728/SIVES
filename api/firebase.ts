import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your project's Firebase configuration.
// You can find this in your Firebase project settings under "Project settings".
const firebaseConfig = {
 
  apiKey: "AIzaSyBc4KWgA77mS-0METDPGqKASbr8Rd7lOBU",
 
  authDomain: "sives-09484188-fd8cb.firebaseapp.com",
 
  projectId: "sives-09484188-fd8cb",
 
  storageBucket: "sives-09484188-fd8cb.firebasestorage.app",
 
  messagingSenderId: "561458248187",
 
  appId: "1:561458248187:web:1e7bf49dbd61eab570735e"
 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
