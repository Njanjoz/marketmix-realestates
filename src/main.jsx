// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css' // <-- IMPORTANT: Import the CSS file

if (Capacitor.getPlatform() === 'android') {
  document.documentElement.classList.add('native-android')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
