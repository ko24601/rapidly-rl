import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDu1pHaVe2f_Wc8QiWRBxbh4Zf20J-QmSY",
  authDomain: "rapidly-rl.firebaseapp.com",
  projectId: "rapidly-rl",
  storageBucket: "rapidly-rl.firebasestorage.app",
  messagingSenderId: "1073457876113",
  appId: "1:1073457876113:web:33571e45d5354232bb0330",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// SHA-256 of "RAPID2026?"
const passHash = '007d8a8c932d305457d2e10c5ebfb056bc8cfe029d361b5178a8812dea391dd7'

await setDoc(doc(db, 'site', 'database'), { passHash }, { merge: true })
console.log('passHash set in Firestore')
process.exit(0)
