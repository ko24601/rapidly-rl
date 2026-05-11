import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDu1pHaVe2f_Wc8QiWRBxbh4Zf20J-QmSY",
  authDomain: "rapidly-rl.firebaseapp.com",
  projectId: "rapidly-rl",
  storageBucket: "rapidly-rl.firebasestorage.app",
  messagingSenderId: "1073457876113",
  appId: "1:1073457876113:web:33571e45d5354232bb0330",
  measurementId: "G-YVLBSCX7CK"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
