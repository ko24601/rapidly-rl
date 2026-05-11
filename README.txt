ESPORTS TEAM TEMPLATE — SETUP GUIDE
=====================================

REQUIRED FILES TO REPLACE / ADD:
----------------------------------
1. /public/logo.png
   Replace with your team logo. Displayed in the navbar and browser favicon.

2. /public/hero-bg.png
   Add a full-width hero background image (recommended: 1920x1080 or larger).
   This appears behind the hero section on the home page.

3. /public/car1.glb, /public/car2.glb, /public/car3.glb
   Add GLB-format 3D car models for the Livery Viewer.
   - Material names containing "primary" will be painted in your primary color.
   - Material names containing "accent" will be painted white.
   - You can add as many cars as you like by updating the DEFAULT_CARS array
     in src/sections/LiveryViewer.jsx.

CONFIGURATION:
--------------
4. src/config.js
   Update all fields with your team's branding:
   - name, shortName, tagline, year
   - primaryColor (hex), primaryGlow (rgba)
   - discord, store, domain

5. src/firebase.js
   Replace the placeholder firebaseConfig object with your actual Firebase
   project credentials from:
   https://console.firebase.google.com/ → Project Settings → Your Apps

   Required Firestore structure (auto-created by the app):
   - Collection: "site" → Document: "database" (stores all site data)
   - Collection: "drivers" (one document per driver)

6. src/pages/Sponsors.jsx
   Replace "YOUR_WEB3FORMS_ACCESS_KEY" with your key from https://web3forms.com/
   This enables the sponsor enquiry form to send email notifications.

7. docs/CNAME
   Replace "yoursite.com" with your actual custom domain (for GitHub Pages).

CUSTOMIZATION TIPS:
-------------------
- Colors: Change primaryColor in src/config.js — all glow effects and accents
  will update automatically.
- Fonts: Change the Google Fonts import in index.html and update CSS variables
  in src/styles/global.css.
- Sections: Each section in src/sections/ is self-contained and can be
  reordered, hidden, or extended independently.

RUNNING LOCALLY:
----------------
  npm install
  npm run dev

BUILDING FOR PRODUCTION:
------------------------
  npm run build
  # Output goes to /docs/ folder (configured for GitHub Pages)
