import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SITE } from './config.js'
import { DatabaseProvider } from './context/DatabaseContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import AnnouncementBanner from './components/AnnouncementBanner.jsx'
import Navbar from './components/Navbar.jsx'
import MobileNav from './components/MobileNav.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Sponsors from './pages/Sponsors.jsx'
import Admin from './pages/Admin.jsx'
import DriversPage from './pages/DriversPage.jsx'
import DriverComparison from './pages/DriverComparison.jsx'
import GamePage from './pages/GamePage.jsx'
import './styles/global.css'

export default function App() {
  useEffect(() => {
    // Inject CSS variables from SITE config
    const root = document.documentElement
    root.style.setProperty('--primary', SITE.primaryColor)
    root.style.setProperty('--primary-glow', SITE.primaryGlow)

    // Security: block devtools shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'F12') { e.preventDefault(); return false }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) { e.preventDefault(); return false }
      if (e.ctrlKey && ['u', 'U', 's', 'S'].includes(e.key)) { e.preventDefault(); return false }
    }
    const handleContextMenu = (e) => e.preventDefault()

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    // Console warning
    console.log('%c⚠️ Stop! This is a browser feature intended for developers.', 'color: red; font-size: 18px; font-weight: bold;')
    console.log('%cIf someone told you to paste something here, they may be trying to compromise your account.', 'font-size: 14px;')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return (
    <DatabaseProvider>
      <ToastProvider>
        <AnnouncementBanner />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/compare" element={<DriverComparison />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
        <Footer />
        <MobileNav />
      </ToastProvider>
    </DatabaseProvider>
  )
}
