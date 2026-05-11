import { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../firebase.js'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore'

const DEFAULT_DB = {
  news: [],
  calendar: [],
  sponsors: [],
  staff: [],
  enquiries: [],
  passHash: '',
}

const DatabaseContext = createContext(null)

export function DatabaseProvider({ children }) {
  const [dbData, setDbData] = useState(DEFAULT_DB)
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const siteRef = doc(db, 'site', 'database')
        const snap = await getDoc(siteRef)
        if (snap.exists()) {
          setDbData({ ...DEFAULT_DB, ...snap.data() })
        }

        const driversSnap = await getDocs(collection(db, 'drivers'))
        const driverList = []
        driversSnap.forEach((d) => driverList.push({ id: d.id, ...d.data() }))
        setDrivers(driverList)
      } catch (err) {
        console.warn('Firebase load error (check your config):', err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function updateDb(changes) {
    const next = { ...dbData, ...changes }
    setDbData(next)
    try {
      await setDoc(doc(db, 'site', 'database'), next, { merge: true })
    } catch (err) {
      console.warn('Firebase write error:', err.message)
    }
  }

  async function saveDriver(id, data) {
    try {
      await setDoc(doc(db, 'drivers', id), data)
      setDrivers((prev) => {
        const exists = prev.find((d) => d.id === id)
        if (exists) return prev.map((d) => (d.id === id ? { id, ...data } : d))
        return [...prev, { id, ...data }]
      })
    } catch (err) {
      console.warn('Driver save error:', err.message)
    }
  }

  async function deleteDriver(id) {
    try {
      await deleteDoc(doc(db, 'drivers', id))
      setDrivers((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.warn('Driver delete error:', err.message)
    }
  }

  return (
    <DatabaseContext.Provider value={{ dbData, updateDb, drivers, saveDriver, deleteDriver, loading }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  return useContext(DatabaseContext)
}
