import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

function Entry() {
  const navigate = useNavigate();

  const handleInput = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value.trim();
      if (value === '0528') {
        navigate('/slingshot?user=d&dest=sun');
      } else if (value === '4096') {
        navigate('/slingshot?user=angi&dest=amethyst');
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
      <input type="text" onKeyDown={handleInput} autoFocus />
    </div>
  );
}

function SolarFlare({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <div className="solar-flare"></div>;
}

function Sun({ vortex }) {
  const [flare, setFlare] = useState(true);

  const completeFlare = () => setFlare(false);

  return (
    <>
      {flare && <SolarFlare onComplete={completeFlare} />}
      <div className={`container sun ${vortex ? 'grayscale vortex' : ''}`}>
        <div className="wood-panel">
          <div className="black-star-icon">★</div> {/* Black Star anchor */}
          <h1>The Studio Bridge</h1>
          <div className="vu-meters">
            <div className="vu-meter"></div>
            <div className="vu-meter"></div>
          </div>
          <div className="nixie-tubes">
            <span className="nixie">0</span>
            <span className="nixie">5</span>
            <span className="nixie">2</span>
            <span className="nixie">8</span>
          </div>
          <button className="console-btn">Add Mix</button>
          <button className="console-btn">Spawn Moon</button>
          {vortex && <p>The Salt is set; let the Spirit speak. We are now in the New Silence.</p>}
        </div>
        <div className="command-deck">
          <div className="radar-map">🗺️</div>
          <div className="readouts">
            <p>> SATURN: ORIGINAL MUSIC</p>
            <p>AMETHYST: ANGI'S VAULT</p>
            <p>VENUS: CURATED MIXES</p>
            <p>MERCURY: LIVE SETS</p>
          </div>
          <div className="navigation">
            <button>EXPLORE</button>
            <button>TUNE</button>
            <button>VOID</button>
          </div>
        </div>
      </div>
    </>
  );
}

function BlackStar({ onPullCord }) {
  const [ignition, setIgnition] = useState(false);

  const pullCord = () => {
    setIgnition(true);
    onPullCord();
  };

  return (
    <div className={`container black-star ${ignition ? 'ignition' : ''}`}>
      <h1>The High-Gloss Vault</h1>
      <p>Modern Reboot Star Trek aesthetic. Glass, white-on-black, ultra-minimalist.</p>
      <button onClick={pullCord} className="cord">Pull the Cord</button>
      {ignition && <div className="event-horizon"></div>}
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

function Mercury() {
  return (
    <div className="container mercury">
      <h1>The VU Meter Chrome</h1>
      <p>Liquid, polished silver. High-energy, fast-moving surface. Houses quick-fire sets and radio transmissions.</p>
    </div>
  );
}

function Venus() {
  return (
    <div className="container venus">
      <h1>The Smoked Glass Curator</h1>
      <p>A secure portal for L to upload and manage curated DJ mixes.</p>
    </div>
  );
}

function Earth() {
  return (
    <div className="container earth">
      <h1>Sonic Architecture Proposals</h1>
      <p>Black marble and raw concrete.</p>
    </div>
  );
}

function Amethyst() {
  return (
    <div className="container amethyst">
      <h1>The Crystal Frequency</h1>
      <p>Raw, jagged amethyst quartz. Backlit by a warm, violet tube-amp glow. Houses sound healing.</p>
    </div>
  );
}

function Slingshot() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const user = params.get('user');
  const dest = params.get('dest');

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/${dest}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, dest]);

  return (
    <div className="slingshot">
      <div className="binary-core">
        <div className="sun-core">☀️</div>
        <div className="black-star-core">⚫</div>
      </div>
      <div className={`start-rim ${user === 'd' ? 'saturn-rim' : 'amethyst-rim'}`}>
        <div className="chakra-warp">
          <div className="orb red"></div>
          <div className="orb orange"></div>
          <div className="orb yellow"></div>
          <div className="orb green"></div>
          <div className="orb blue"></div>
          <div className="orb indigo"></div>
          <div className="orb violet"></div>
        </div>
        <div className="slingshot-path"></div>
      </div>
    </div>
  );
}

function App() {
  const [globalVortex, setGlobalVortex] = useState(false);

  return (
    <div className={globalVortex ? 'new-silence' : ''}>
      <Router>
        <Routes>
        <Route path="/slingshot" element={<Slingshot />} />
          <Route path="/sun" element={<Sun vortex={globalVortex} />} />
          <Route path="/black-star" element={<BlackStar onPullCord={() => setGlobalVortex(true)} />} />
          <Route path="/saturn" element={<Saturn />} />
          <Route path="/moons" element={<Moons />} />
          <Route path="/mercury" element={<Mercury />} />
          <Route path="/venus" element={<Venus />} />
          <Route path="/earth" element={<Earth />} />
          <Route path="/amethyst" element={<Amethyst />} />
          <Route path="/pluto" element={<Pluto />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;