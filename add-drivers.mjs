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

const drivers = [
  { id: 'driver_1001', name: 'Charlie Backhouse', discord: 'chazzer0181', category: 'Merc / Kick',          nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1002', name: 'PRLRonan',           discord: 'ronanbird',      category: 'PRL Esports',        nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1003', name: 'PRLMELDRUM',         discord: 'meldrum989811',  category: 'McLaren',            nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1004', name: 'Unc',                discord: '15u3k',          category: 'T1 Haas',            nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1005', name: 'KVIX',               discord: 'gtr24601',       category: 'T1 Haas',            nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1006', name: 'Josh',               discord: 'autismboi8008',  category: 'Ferrari',            nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1007', name: 'Urky',               discord: 'urkyboy185084',  category: 'TBD',                nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1008', name: 'Slicer',             discord: 'slicer791',      category: 'Red Bull / VCARB',   nationality: '', number: '', bio: '', photo: '' },
  { id: 'driver_1009', name: 'Joseph Singh',       discord: 'joseph_singh30', category: 'Haas / Ferrari',     nationality: '', number: '', bio: '', photo: '' },
]

await setDoc(doc(db, 'site', 'database'), { drivers }, { merge: true })
console.log(`✓ Written ${drivers.length} drivers to site/database`)
process.exit(0)
