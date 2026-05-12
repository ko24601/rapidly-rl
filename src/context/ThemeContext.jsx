import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.style.setProperty('--bg', '#f0f0f0')
      root.style.setProperty('--surface', '#e0e0e0')
      root.style.setProperty('--card', 'rgba(255,255,255,0.95)')
      root.style.setProperty('--text', '#111111')
      root.style.setProperty('--muted', '#666666')
      root.style.setProperty('--border', 'rgba(0,0,0,0.1)')
    } else {
      root.style.setProperty('--bg', '#050505')
      root.style.setProperty('--surface', '#080808')
      root.style.setProperty('--card', 'rgba(10,10,10,0.95)')
      root.style.setProperty('--text', '#e8e8e8')
      root.style.setProperty('--muted', '#555')
      root.style.setProperty('--border', 'rgba(255,255,255,0.07)')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggle() { setTheme(t => t === 'dark' ? 'light' : 'dark') }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
