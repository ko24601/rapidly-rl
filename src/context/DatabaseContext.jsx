import { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../firebase.js'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const DEFAULT_DB = {
  news: [],
  calendar: [],
  sponsors: [],
  staff: [],
  enquiries: [],
  passHash: '',
  results: [],
  standings: [],
  gallery: [],
  drivers: [],
}

const DatabaseContext = createContext(null)

export function DatabaseProvider({ children }) {
  const [dbData, setDbData] = useState(DEFAULT_DB)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const siteRef = doc(db, 'site', 'database')
        const snap = await getDoc(siteRef)
        if (snap.exists()) {
          setDbData({ ...DEFAULT_DB, ...snap.data() })
        }
      } catch (err) {
        console.warn('Firebase load error:', err.message)
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

  const drivers = dbData.drivers || []

  async function saveDriver(id, data) {
    const existing = drivers.find(d => d.id === id)
    let next
    if (existing) {
      next = drivers.map(d => d.id === id ? { id, ...data } : d)
    } else {
      next = [...drivers, { id, ...data }]
    }
    await updateDb({ drivers: next })
  }

  async function deleteDriver(id) {
    await updateDb({ drivers: drivers.filter(d => d.id !== id) })
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
