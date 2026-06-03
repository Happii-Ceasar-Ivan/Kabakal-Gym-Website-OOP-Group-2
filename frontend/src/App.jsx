import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Placeholders for future Sprint 1 views */}
        <Route path="/login" element={<div style={{color:'white'}}>Login Page (WIP)</div>} />
        <Route path="/register" element={<div style={{color:'white'}}>Register Page (WIP)</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
