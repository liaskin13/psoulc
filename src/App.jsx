import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function Entry() {
  const navigate = useNavigate();

  const handleInput = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value === '0528') {
        navigate('/sun');
      } else if (value === '7677') {
        navigate('/black-star');
      } else if (value === '1111') {
        navigate('/moons');
      } else if (value === '1010') {
        navigate('/saturn');
      } else {
        navigate('/pluto');
      }
    }
  };

  return (
    <div className="entry">
      <input type="text" onKeyDown={handleInput} placeholder="Type into the Void" autoFocus />
    </div>
  );
}

function Sun() {
  const [vortex, setVortex] = useState(false);

  const triggerVortex = () => {
    setVortex(true);
    // In a real app, this would lock orbits and reroute users
  };

  return (
    <div className={`container sun ${vortex ? 'grayscale' : ''}`}>
      <h1>The Studio Bridge</h1>
      <p>Dark Walnut wood-paneling wrap with VU meters and Nixie tubes.</p>
      <button onClick={triggerVortex} className="cord">Pull the Cord</button>
      {vortex && <p>The Salt is set; let the Spirit speak. We are now in the New Silence.</p>}
    </div>
  );
}

function BlackStar() {
  return (
    <div className="container black-star">
      <h1>The High-Gloss Vault</h1>
      <p>Modern Reboot Star Trek aesthetic. Glass, white-on-black, ultra-minimalist.</p>
    </div>
  );
}

function Saturn() {
  return (
    <div className="container saturn">
      <h1>The Brushed Steel Vault</h1>
      <p>Texture of high-end rack gear/MPC. Gilded metallic rings. Houses the Originals and the Collective.</p>
    </div>
  );
}

function Moons() {
  return (
    <div className="container moons">
      <h1>The Backlit Pad Glow</h1>
      <p>Iridescent, soft-focus luminescence for the Love Letters.</p>
    </div>
  );
}

function Pluto() {
  return (
    <div className="container pluto">
      <h1>The Acoustic Foam Void</h1>
      <p>Non-reflective, deep-shadow black. The access request filter.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/sun" element={<Sun />} />
        <Route path="/black-star" element={<BlackStar />} />
        <Route path="/saturn" element={<Saturn />} />
        <Route path="/moons" element={<Moons />} />
        <Route path="/pluto" element={<Pluto />} />
      </Routes>
    </Router>
  );
}

export default App;