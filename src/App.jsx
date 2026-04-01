import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function Entry() {
  const navigate = useNavigate();

  const handleInput = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value === '0528') {
        navigate('/god-mode');
      } else if (value === '7677') {
        navigate('/the-shield');
      } else {
        navigate('/pluto');
      }
    }
  };

  return (
    <div className="container">
      <h1>PSC Universe Terminal Gate</h1>
      <p>Enter the access code:</p>
      <input type="text" onKeyDown={handleInput} placeholder="Code" autoFocus />
    </div>
  );
}

function GodMode() {
  return (
    <div className="container">
      <h1>God Mode Activated</h1>
      <p>Welcome to the ultimate control.</p>
    </div>
  );
}

function TheShield() {
  return (
    <div className="container">
      <h1>The Shield</h1>
      <p>Defensive protocols engaged.</p>
    </div>
  );
}

function Pluto() {
  return (
    <div className="container">
      <h1>Pluto</h1>
      <p>The outer orbit.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/god-mode" element={<GodMode />} />
        <Route path="/the-shield" element={<TheShield />} />
        <Route path="/pluto" element={<Pluto />} />
      </Routes>
    </Router>
  );
}

export default App;