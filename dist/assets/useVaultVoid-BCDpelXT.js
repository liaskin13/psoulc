import{a as e}from"./rolldown-runtime-COnpUsM8.js";import{i as t,k as n,n as r,r as i,t as a}from"./postfx-vendor-CgtXPExr.js";import{a as o,i as s,n as c,r as l}from"./motion-vendor-CqK2quqt.js";var u=null,d=null,f=98,p=!1;function m(){try{let e=new(window.AudioContext||window.webkitAudioContext);return e.state===`suspended`&&e.resume().catch(()=>{}),e}catch{return null}}var h=null;function g(){return(!h||h.state===`closed`)&&(h=m()),h?.state===`suspended`&&h.resume().catch(()=>{}),h}function _(e,t){return e/120*528*t}function v(e=98,t=1){try{p&&y();let n=g();if(!n)return;p=!0,f=e,d=n.createOscillator(),u=n.createGain();let r=_(e,t);d.frequency.value=r,d.type=`sine`,u.gain.setValueAtTime(0,n.currentTime),u.gain.linearRampToValueAtTime(.015,n.currentTime+.3),d.connect(u),u.connect(n.destination),d.start()}catch{}}function y(){try{if(!p)return;p=!1,u&&h&&(u.gain.cancelScheduledValues(h.currentTime),u.gain.linearRampToValueAtTime(0,h.currentTime+.15));let e=d;setTimeout(()=>{try{e?.stop()}catch{}},200),d=null,u=null}catch{}}function b(e=98){try{y();let t=g();if(!t)return;let n=t.createOscillator(),r=t.createGain(),i=t.currentTime;n.type=`sawtooth`,n.frequency.setValueAtTime(_(e,2),i),n.frequency.linearRampToValueAtTime(_(e,.25),i+1),r.gain.setValueAtTime(.02,i),r.gain.exponentialRampToValueAtTime(1e-4,i+1.1),n.connect(r),r.connect(t.destination),n.start(i),n.stop(i+1.2)}catch{}}function x(e=98){try{y();let t=g();if(!t)return;let n=t.createOscillator(),r=t.createGain(),i=t.currentTime;n.type=`triangle`,n.frequency.setValueAtTime(_(e,.5),i),n.frequency.linearRampToValueAtTime(_(e,3),i+.8),r.gain.setValueAtTime(.02,i),r.gain.exponentialRampToValueAtTime(1e-4,i+.9),n.connect(r),r.connect(t.destination),n.start(i),n.stop(i+1)}catch{}}function S(e){try{if(!p||!d||!h)return;let t=_(f,e);d.frequency.linearRampToValueAtTime(t,h.currentTime+.1)}catch{}}var C=e(o(),1),w=s(),T=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,E=`
  precision highp float;
  uniform float uTime;
  uniform float uBPM;
  uniform float uPitch;
  varying vec2 vUv;

  // Smooth HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    // Center the UV
    vec2 uv = vUv - 0.5;
    float r  = length(uv);
    float theta = atan(uv.y, uv.x);

    // ── Record spin: BPM → RPM → rad/sec ────────────────────
    // 33⅓ RPM = one rotation every 1.8s. Scale by BPM ratio.
    float rps      = (uBPM * uPitch / 60.0) * (1.0 / 33.333);
    float rotation = uTime * rps * 6.2831853; // radians per second
    float rotTheta = theta + rotation;

    // ── 70s Stroboscopic Shutter ─────────────────────────────
    // Shutter fires at 1× BPM rate. When closed, vinyl goes near-black.
    // shutterOpen = 0.62 → shutter is open for 62% of each BPM cycle.
    float shutterHz    = uBPM * uPitch / 60.0;
    float shutterPhase = fract(uTime * shutterHz);
    float shutterOpen  = 0.62;
    float strobe       = step(shutterPhase, shutterOpen);

    // ── Vinyl record surface ──────────────────────────────────
    // Grooves: concentric rings with micro-shimmer
    float groove = fract(r * 40.0);
    float grooveShin  = smoothstep(0.05, 0.0, groove) + smoothstep(0.9, 1.0, groove);

    // Groove reflection — warm amber glint, direction-dependent
    float glintAngle = mod(rotTheta, 6.2831853);
    float glint = pow(max(0.0, cos(glintAngle * 12.0)), 18.0) * grooveShin;

    // Base vinyl color — very dark with warm tint
    vec3 vinylBase = vec3(0.04, 0.035, 0.032);
    vinylBase += glint * vec3(0.18, 0.13, 0.06);  // amber groove shimmer

    // ── Label area (inner circle r < 0.20) ───────────────────
    // Amber/gold color with radial stripe pattern
    float isLabel    = 1.0 - step(0.21, r);
    float labelStripe = step(0.5, fract(rotTheta * 4.0 / 6.2831853));  // 4 stripes
    vec3 labelAmber   = vec3(0.78, 0.50, 0.08);
    vec3 labelDark    = vec3(0.45, 0.28, 0.04);
    vec3 labelColor   = mix(labelDark, labelAmber, labelStripe * 0.4 + 0.6);

    // Spindle hole
    float isSpindle  = step(r, 0.04);

    // ── Assemble final color ──────────────────────────────────
    vec3 color = mix(vinylBase, labelColor, isLabel);
    color      = mix(color, vec3(0.0), isSpindle);

    // Apply stroboscopic shutter
    // When closed (strobe=0): record drops to ~8% brightness (still visible as dark disc)
    color = mix(color * 0.08, color, strobe);

    // Honey Amber point light — rim highlight at top-left
    float rimAngle = mod(theta - 2.4, 6.2831853);
    float rim = pow(max(0.0, 1.0 - abs(rimAngle - 3.14159) / 2.5), 2.5) * (1.0 - r);
    color += rim * vec3(0.22, 0.14, 0.03) * strobe;

    // Record boundary — sharp edge at r=0.49
    float isRecord = 1.0 - step(0.49, r);
    float alpha    = isRecord;

    gl_FragColor = vec4(color, alpha);
  }
`;function D({bpm:e,pitchMultiplier:n}){let r=(0,C.useRef)(),i=(0,C.useRef)({uTime:{value:0},uBPM:{value:e||98},uPitch:{value:n||1}});return t(t=>{i.current.uTime.value=t.clock.getElapsedTime(),i.current.uBPM.value=e||98,i.current.uPitch.value=n||1}),(0,w.jsxs)(`mesh`,{rotation:[-Math.PI/2,0,0],children:[(0,w.jsx)(`cylinderGeometry`,{args:[1,1,.04,128,1]}),(0,w.jsx)(`shaderMaterial`,{ref:r,vertexShader:T,fragmentShader:E,uniforms:i.current,transparent:!0,side:0})]})}function O({bpm:e=98,pitchMultiplier:t=1,size:r=160,chakraColor:a=null}){return(0,w.jsxs)(`div`,{style:{position:`relative`,width:r,height:r,flexShrink:0},children:[(0,w.jsxs)(i,{style:{width:r,height:r,pointerEvents:`none`},camera:{position:[0,1.8,0],fov:45,near:.01,far:10},gl:{antialias:!0,alpha:!0,powerPreference:`high-performance`,outputColorSpace:n},onCreated:({gl:e,camera:t})=>{e.setClearColor(0,0),t.lookAt(0,0,0)},children:[(0,w.jsx)(`pointLight`,{position:[-1.2,2.5,.5],color:`#d4830a`,intensity:3.5,distance:8,decay:1.5}),(0,w.jsx)(`ambientLight`,{color:`#200e00`,intensity:.4}),(0,w.jsx)(D,{bpm:e,pitchMultiplier:t})]}),a&&(0,w.jsx)(`div`,{"aria-hidden":`true`,style:{position:`absolute`,inset:0,borderRadius:`50%`,background:a,opacity:.22,mixBlendMode:`screen`,pointerEvents:`none`}})]})}function k({onPlay:e,onStop:t,onRewind:n,onFastForward:r,onPause:i,onRecord:a,onPitchChange:o,pitchMultiplier:s=1,activeTrack:l,transportState:u,showAdminCommands:d=!1,isAdmin:f=!1,onAdminArm:p,onAdminCommit:m,onAdminSeal:h,onAdminClear:g}){let _=(()=>{if(!l?.sublabel)return 98;let e=l.sublabel.match(/(\d+)\s*BPM/i);return e?parseInt(e[1],10):98})(),C=()=>{v(_,s),e?.()},T=()=>{y(),t?.()},E=()=>{b(_),n?.()},D=()=>{x(_),r?.()},k=()=>{i?.()},A=()=>{a?.()},j=e=>{S(e),o?.(e)},M=[{id:`rewind`,symbol:`◀◀`,label:`REW`,action:E},{id:`play`,symbol:`▶`,label:`PLAY`,action:C},{id:`stop`,symbol:`■`,label:`STOP`,action:T},{id:`pause`,symbol:`▮▮`,label:`PAUSE`,action:k},{id:`ff`,symbol:`▶▶`,label:`FF`,action:D}];return(0,w.jsxs)(c.div,{className:`studer-transport`,initial:{y:100},animate:{y:0},transition:{type:`spring`,stiffness:100,damping:18},children:[(0,w.jsx)(`div`,{className:`transport-readout ${l?`loaded`:`idle`}`,children:l?(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(O,{bpm:_,pitchMultiplier:s,size:52,chakraColor:l.chakraColor||null}),(0,w.jsxs)(`div`,{className:`readout-text`,children:[(0,w.jsxs)(`div`,{className:`readout-track-line`,children:[(0,w.jsx)(`span`,{className:`readout-arrow`,children:`▶`}),(0,w.jsx)(`span`,{className:`readout-title`,children:l.label})]}),l.sublabel&&(0,w.jsx)(`span`,{className:`readout-meta`,children:l.sublabel}),u&&(0,w.jsx)(`span`,{className:`readout-state state-${u}`,children:u===`pause`?`▮▮ PAUSE`:u===`record`?`● VOICE NOTE ARMED`:u.toUpperCase()})]})]}):(0,w.jsx)(`span`,{className:`readout-idle`,children:`— NO SELECTION —`})}),(0,w.jsxs)(`div`,{className:`transport-controls`,children:[M.map(e=>(0,w.jsxs)(`button`,{className:`transport-btn btn-${e.id} ${u===e.id?`transport-active`:``}`,onClick:e.action,title:e.label,children:[(0,w.jsx)(`span`,{className:`btn-symbol`,children:e.symbol}),(0,w.jsx)(`span`,{className:`btn-label`,children:e.label})]},e.id)),(0,w.jsxs)(`button`,{className:`transport-btn btn-record voice-rec-btn ${u===`record`?`transport-active`:``}`,onClick:A,disabled:!l,title:`Voice Transmission — record a note onto this file`,"aria-label":`Arm voice note recording`,children:[(0,w.jsx)(`span`,{className:`btn-symbol`,children:`●`}),(0,w.jsx)(`span`,{className:`btn-label`,children:`REC`})]})]}),d&&(0,w.jsxs)(`div`,{className:`transport-admin`,role:`group`,"aria-label":`Admin commands`,children:[(0,w.jsx)(`button`,{className:`transport-admin-btn`,onClick:p,disabled:!f||!l,title:`Arm void on selected file`,children:`ARM`}),(0,w.jsx)(`button`,{className:`transport-admin-btn`,onClick:m,disabled:!f,title:`Commit armed void`,children:`COMMIT`}),(0,w.jsx)(`button`,{className:`transport-admin-btn`,onClick:h,disabled:!f,title:`Seal and cancel pending actions`,children:`SEAL`}),(0,w.jsx)(`button`,{className:`transport-admin-btn`,onClick:g,disabled:!f,title:`Clear selection and reset`,children:`CLEAR`})]}),(0,w.jsxs)(`div`,{className:`pitch-control`,children:[(0,w.jsx)(`span`,{className:`pitch-label`,children:`VARISPEED`}),(0,w.jsx)(`input`,{type:`range`,min:`0.5`,max:`2.0`,step:`0.05`,value:s,onChange:e=>j(parseFloat(e.target.value)),className:`pitch-slider`}),(0,w.jsxs)(`span`,{className:`pitch-value`,children:[s.toFixed(2),`×`]})]})]})}var A=.35,j=1.8;function M({onInverseBloom:e}){let n=(0,C.useRef)(),i=(0,C.useRef)(),o=(0,C.useRef)();return t(e=>{let t=e.clock.getElapsedTime()*A;n.current&&n.current.position.set(j*Math.cos(t),.2*Math.sin(t*.5),j*Math.sin(t)),i.current&&i.current.position.set(-j*Math.cos(t),-.2*Math.sin(t*.5),-j*Math.sin(t)),o.current&&(o.current.position.copy(i.current.position),o.current.rotation.y+=.01)}),(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(`ambientLight`,{color:`#1a1030`,intensity:.5}),(0,w.jsxs)(`group`,{ref:n,children:[(0,w.jsx)(`pointLight`,{color:`#ffea00`,intensity:4,distance:20,decay:1.8}),(0,w.jsxs)(`mesh`,{children:[(0,w.jsx)(`sphereGeometry`,{args:[.5,32,32]}),(0,w.jsx)(`meshStandardMaterial`,{color:`#ffea00`,emissive:`#ffea00`,emissiveIntensity:1,metalness:0,roughness:.4})]}),(0,w.jsxs)(`mesh`,{scale:1.4,children:[(0,w.jsx)(`sphereGeometry`,{args:[.5,16,16]}),(0,w.jsx)(`meshStandardMaterial`,{color:`#c5a025`,transparent:!0,opacity:.15,emissive:`#c5a025`,emissiveIntensity:.4})]})]}),(0,w.jsxs)(`group`,{ref:i,children:[(0,w.jsxs)(`mesh`,{children:[(0,w.jsx)(`sphereGeometry`,{args:[.55,32,32]}),(0,w.jsx)(`meshStandardMaterial`,{color:`#000000`,emissive:`#000000`,emissiveIntensity:0,roughness:0,metalness:1})]}),(0,w.jsxs)(`mesh`,{ref:o,rotation:[Math.PI/2.5,0,0],children:[(0,w.jsx)(`torusGeometry`,{args:[.65,.06,16,80]}),(0,w.jsx)(`meshStandardMaterial`,{color:`#8B0000`,emissive:`#ff1111`,emissiveIntensity:.8,transparent:!0,opacity:.85})]}),(0,w.jsxs)(`mesh`,{scale:1.7,children:[(0,w.jsx)(`sphereGeometry`,{args:[.55,16,16]}),(0,w.jsx)(`meshStandardMaterial`,{color:`#200010`,transparent:!0,opacity:.25,emissive:`#500020`,emissiveIntensity:.2})]})]}),(0,w.jsxs)(`points`,{children:[(0,w.jsx)(`bufferGeometry`,{children:(0,w.jsx)(`bufferAttribute`,{attach:`attributes-position`,count:400,array:(()=>{let e=new Float32Array(400*3);for(let t=0;t<400;t++)e[t*3]=(Math.random()-.5)*40,e[t*3+1]=(Math.random()-.5)*40,e[t*3+2]=(Math.random()-.5)*40;return e})(),itemSize:3})}),(0,w.jsx)(`pointsMaterial`,{color:`#9090a0`,size:.05,sizeAttenuation:!0})]}),(0,w.jsx)(a,{children:(0,w.jsx)(r,{luminanceThreshold:.2,luminanceSmoothing:.9,intensity:1.8,mipmapBlur:!0,radius:.9})})]})}var N=(0,C.forwardRef)(function({inverseBloom:e,voidArmed:t=!1,armedLabel:r=`SELECTED FILE`,onCancelVoid:a,onConfirmVoid:o},s){let c=(0,C.useRef)();return(0,C.useImperativeHandle)(s,()=>({getBlackStarTarget:()=>{if(!c.current)return null;let e=c.current.getBoundingClientRect();return{x:e.left+e.width*.38,y:e.top+e.height*.52}},getRect:()=>c.current?.getBoundingClientRect()??null})),(0,w.jsxs)(`div`,{ref:c,className:`vault-window-porthole ${e?`vault-window-inverse-bloom`:``}`,title:`Binary Core — Black Star Gravitational Anchor`,children:[(0,w.jsxs)(`div`,{className:`vault-window-label`,children:[(0,w.jsx)(`span`,{className:`vault-window-dot`}),`BINARY CORE`]}),(0,w.jsx)(i,{camera:{position:[0,3,8],fov:38,near:.1,far:200},style:{width:`100%`,height:`100%`},gl:{antialias:!0,powerPreference:`high-performance`,outputColorSpace:n,toneMapping:4},onCreated:({gl:e,camera:t})=>{e.setClearColor(131077,1),e.toneMappingExposure=1,t.lookAt(0,0,0)},children:(0,w.jsx)(M,{})}),e&&(0,w.jsx)(`div`,{className:`inverse-bloom-flash`}),t&&(0,w.jsxs)(`div`,{className:`vault-void-armed-overlay`,role:`dialog`,"aria-live":`polite`,"aria-label":`Void confirmation`,children:[(0,w.jsx)(`div`,{className:`vault-void-armed-title`,children:`VOID ARMED`}),(0,w.jsx)(`div`,{className:`vault-void-armed-file`,children:r}),(0,w.jsxs)(`div`,{className:`vault-void-armed-actions`,children:[(0,w.jsx)(`button`,{className:`vault-void-cancel`,onClick:a,children:`CANCEL`}),(0,w.jsx)(`button`,{className:`vault-void-confirm`,onClick:o,children:`COMMIT`})]})]})]})});function P({active:e,source:t,target:n,color:r,onComplete:i}){let[a,o]=(0,C.useState)(`idle`);if((0,C.useEffect)(()=>{if(!e){o(`idle`);return}o(`stretch`);let t=setTimeout(()=>{o(`fade`),setTimeout(()=>{o(`idle`),i?.()},400)},900);return()=>clearTimeout(t)},[e]),a===`idle`||!t||!n)return null;let s=n.x-t.x,u=n.y-t.y,d=Math.sqrt(s*s+u*u),f=180/Math.PI*Math.atan2(u,s),p=r||`#9b59b6`;return(0,w.jsxs)(`div`,{style:{position:`fixed`,inset:0,pointerEvents:`none`,zIndex:9900},children:[(0,w.jsxs)(l,{children:[a===`stretch`&&(0,w.jsx)(c.div,{style:{position:`absolute`,left:t.x,top:t.y-2,width:d,height:3,transformOrigin:`left center`,transform:`rotate(${f}deg)`,background:`linear-gradient(
                to right,
                ${p} 0%,
                ${p}cc 30%,
                rgba(0,0,0,0.6) 70%,
                transparent 100%
              )`,borderRadius:3,boxShadow:`0 0 12px ${p}, 0 0 4px ${p}`},initial:{scaleX:0,opacity:1},animate:{scaleX:1,opacity:1},exit:{opacity:0},transition:{duration:.85,ease:[.2,0,.8,1]}},`streak`),a===`fade`&&(0,w.jsx)(c.div,{style:{position:`absolute`,left:t.x,top:t.y-2,width:d,height:3,transformOrigin:`left center`,transform:`rotate(${f}deg)`,background:`linear-gradient(
                to right,
                ${p}44 0%,
                transparent 100%
              )`,borderRadius:3},initial:{opacity:1},animate:{opacity:0},transition:{duration:.35,ease:`easeOut`}},`streak-fade`)]}),(0,w.jsx)(l,{children:a===`stretch`&&(0,w.jsx)(c.div,{style:{position:`absolute`,left:n.x-20,top:n.y-20,width:40,height:40,borderRadius:`50%`,background:`radial-gradient(circle, ${p}88 0%, transparent 70%)`,boxShadow:`0 0 20px ${p}66`},initial:{scale:0,opacity:0},animate:{scale:[0,1.8,1.2],opacity:[0,1,0]},transition:{duration:.85,delay:.65,ease:`easeOut`}},`impact`)})]})}var F=null;function I(){return(!F||F.state===`closed`)&&(F=new(window.AudioContext||window.webkitAudioContext)),F.state===`suspended`&&F.resume().catch(()=>{}),F}var L=null,R=null;function z(){try{let e=I();if(R&&L){L.gain.cancelScheduledValues(e.currentTime),L.gain.linearRampToValueAtTime(.022,e.currentTime+.25);return}let t=e.sampleRate*2,n=e.createBuffer(1,t,e.sampleRate),r=n.getChannelData(0),i=0,a=0,o=0,s=0,c=0,l=0,u=0;for(let e=0;e<t;e++){let t=Math.random()*2-1;i=.99886*i+t*.0555179,a=.99332*a+t*.0750759,o=.969*o+t*.153852,s=.8665*s+t*.3104856,c=.55*c+t*.5329522,l=-.7616*l-t*.016898,r[e]=(i+a+o+s+c+l+u+t*.5362)*.11,u=t*.115926}R=e.createBufferSource(),R.buffer=n,R.loop=!0;let d=e.createBiquadFilter();d.type=`highpass`,d.frequency.value=1200,d.Q.value=.5;let f=e.createBiquadFilter();f.type=`bandpass`,f.frequency.value=5500,f.Q.value=.7,L=e.createGain(),L.gain.setValueAtTime(0,e.currentTime),L.gain.linearRampToValueAtTime(.022,e.currentTime+.3),R.connect(d),d.connect(f),f.connect(L),L.connect(e.destination),R.start()}catch{}}function B(){try{if(!L||!F)return;let e=F;L.gain.cancelScheduledValues(e.currentTime),L.gain.linearRampToValueAtTime(0,e.currentTime+.4);let t=R;setTimeout(()=>{try{t?.stop()}catch{}R=null,L=null},500)}catch{}}function V(){try{let e=I(),t=e.currentTime,n=1.8,r=e.createOscillator(),i=e.createOscillator(),a=e.createGain(),o=e.createGain();r.type=`sawtooth`,i.type=`triangle`,r.frequency.setValueAtTime(220,t),r.frequency.exponentialRampToValueAtTime(12,t+n),i.frequency.setValueAtTime(330,t),i.frequency.exponentialRampToValueAtTime(8,t+n),a.gain.setValueAtTime(.045,t),a.gain.exponentialRampToValueAtTime(1e-4,t+n),o.gain.setValueAtTime(.025,t),o.gain.exponentialRampToValueAtTime(1e-4,t+n+.2);let s=e.createWaveShaper(),c=new Float32Array(256);for(let e=0;e<256;e++){let t=e*2/256-1;c[e]=(Math.PI+200)*t/(Math.PI+200*Math.abs(t))}s.curve=c,r.connect(s),s.connect(a),i.connect(o),a.connect(e.destination),o.connect(e.destination),r.start(t),i.start(t),r.stop(t+n+.1),i.stop(t+n+.3)}catch{}}function H(){try{let e=I(),t=e.currentTime,n=e.createOscillator(),r=e.createGain();n.frequency.value=528,n.type=`sine`,r.gain.setValueAtTime(0,t),r.gain.linearRampToValueAtTime(.028,t+.08),r.gain.setValueAtTime(.028,t+.6),r.gain.exponentialRampToValueAtTime(1e-4,t+1.1),n.connect(r),r.connect(e.destination),n.start(t),n.stop(t+1.2)}catch{}}function U({onVoid:e,voidColor:t}){let n=(0,C.useRef)(),[r,i]=(0,C.useState)(!1),[a,o]=(0,C.useState)(null),[s,c]=(0,C.useState)(null),[l,u]=(0,C.useState)(!1),[d,f]=(0,C.useState)(null),[p,m]=(0,C.useState)(null),h=()=>n.current?.getBlackStarTarget()??{x:window.innerWidth-128,y:window.innerHeight-180},g=(0,C.useCallback)((e,t)=>{let n=t??{x:window.innerWidth/2,y:window.innerHeight/2},r=h();f(e),o(n),c(r),i(!0),B(),V()},[]),_=(0,C.useCallback)((e,t)=>{m({item:e,sourcePos:t})},[]),v=(0,C.useCallback)(e=>{m({item:e,sourcePos:null})},[]),y=(0,C.useCallback)(()=>{m(null)},[]),b=(0,C.useCallback)(()=>{p?.item&&(g(p.item,p.sourcePos),m(null))},[p,g]);return{vaultWindowRef:n,voidProps:{active:r,source:a,target:s,color:t,onComplete:(0,C.useCallback)(()=>{if(i(!1),!d)return;let t=d;f(null),u(!0),setTimeout(()=>u(!1),500),e?.(t)},[d,e])},inverseBloom:l,isVoidArmed:!!p,armedVoidLabel:p?.item?.label||`SELECTED FILE`,cancelArmedVoid:y,confirmArmedVoid:b,handleShelfVoid:_,handleVoidButton:v}}export{P as a,B as i,H as n,N as o,z as r,k as s,U as t};