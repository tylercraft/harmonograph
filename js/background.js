// Animated canvas background — three blur layers + fog overlay.
// Tube color and opacity vary per theme; fog color matches background.

(function () {
  const root   = document.getElementById('root');
  const layers = ['ambient','halo','body-c','fog'].map(id => document.getElementById(id));
  const [aC,hC,bC,fC] = layers.map(c => c.getContext('2d'));
  let W, H;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    layers.forEach(c => { c.width = W; c.height = H; });
  }
  window.addEventListener('resize', resize);
  resize();

  // Eight phase offsets + a random path variant, both chosen once per page load.
  // T_OFFSET drops the animation into a random point mid-journey so it never
  // starts from the same position.
  const P = Array.from({ length: 8 }, () => Math.random() * Math.PI * 2);
  const T_OFFSET = Math.random() * 120;

  const TUBE_PATHS = [
    // Original — asymmetric arch, wide y swing
    t => {
      const baseX = 0.28 + 0.16 * Math.sin(t * 0.65 + P[0]);
      const baseY = 0.50 + 0.43 * Math.sin(t * 1.05 + P[1]);
      const wobX  = Math.sin(t * 0.29 + P[2]) * 0.055 + Math.sin(t * 0.67 + P[3]) * 0.035;
      const wobY  = Math.sin(t * 0.41 + P[4]) * 0.045 + Math.sin(t * 0.19 + P[5]) * 0.025;
      return { x: W * (baseX + wobX), y: H * (baseY + wobY) };
    },
    // Balanced — equal amplitudes, same frequencies
    t => {
      const x   = 0.50 + 0.34 * Math.sin(t * 0.65 + P[0]);
      const y   = 0.50 + 0.34 * Math.sin(t * 1.05 + P[1]);
      const wobX = Math.sin(t * 0.29 + P[2]) * 0.04 + Math.sin(t * 0.67 + P[3]) * 0.025;
      const wobY = Math.sin(t * 0.41 + P[4]) * 0.04 + Math.sin(t * 0.19 + P[5]) * 0.02;
      return { x: W * (x + wobX), y: H * (y + wobY) };
    },
    // Lissajous 2:3
    t => {
      const s = 0.28;
      const x = 0.50 + 0.38 * Math.sin(2 * s * t + P[0]);
      const y = 0.50 + 0.38 * Math.sin(3 * s * t + P[1]);
      return { x: W * (x + Math.sin(t * 0.17 + P[2]) * 0.03), y: H * (y + Math.sin(t * 0.23 + P[4]) * 0.03) };
    },
    // Lissajous 3:5
    t => {
      const s = 0.22;
      const x = 0.50 + 0.38 * Math.sin(3 * s * t + P[0]);
      const y = 0.50 + 0.38 * Math.sin(5 * s * t + P[1]);
      return { x: W * (x + Math.sin(t * 0.11 + P[2]) * 0.025), y: H * (y + Math.sin(t * 0.17 + P[4]) * 0.025) };
    },
    // Lissajous 3:4
    t => {
      const s = 0.24;
      const x = 0.50 + 0.38 * Math.sin(3 * s * t + P[0]);
      const y = 0.50 + 0.38 * Math.sin(4 * s * t + P[1]);
      return { x: W * (x + Math.sin(t * 0.13 + P[2]) * 0.03), y: H * (y + Math.sin(t * 0.19 + P[4]) * 0.025) };
    },
    // Rotary — one circular pendulum + lateral
    t => {
      const x = 0.50 + 0.28 * Math.sin(t * 0.55 + P[0]) + 0.14 * Math.sin(t * 0.38 + P[2]);
      const y = 0.50 + 0.28 * Math.cos(t * 0.55 + P[1]) + 0.14 * Math.sin(t * 0.38 + P[4]);
      return { x: W * x, y: H * y };
    },
    // Double rotary — two circular pendulums
    t => {
      const x = 0.50 + 0.22 * Math.sin(t * 0.62 + P[0]) + 0.16 * Math.sin(t * 0.97 + P[2]);
      const y = 0.50 + 0.22 * Math.cos(t * 0.62 + P[1]) + 0.16 * Math.cos(t * 0.97 + P[3]);
      return { x: W * (x + Math.sin(t * 0.21 + P[6]) * 0.025), y: H * (y + Math.sin(t * 0.17 + P[7]) * 0.02) };
    },
    // Golden ratio drift
    t => {
      const phi = (1 + Math.sqrt(5)) / 2;
      const x   = 0.50 + 0.36 * Math.sin(t * 0.5 + P[0]);
      const y   = 0.50 + 0.36 * Math.sin(t * 0.5 * phi + P[1]);
      const wobX = Math.sin(t * 0.13 + P[2]) * 0.05 + Math.sin(t * 0.31 + P[3]) * 0.03;
      const wobY = Math.sin(t * 0.17 + P[4]) * 0.04 + Math.sin(t * 0.23 + P[5]) * 0.03;
      return { x: W * (x + wobX), y: H * (y + wobY) };
    },
    // Three-frequency per axis
    t => {
      const x = 0.50 + 0.22 * Math.sin(t * 0.65 + P[0]) + 0.10 * Math.sin(t * 1.30 + P[2]) + 0.05 * Math.sin(t * 0.33 + P[4]);
      const y = 0.50 + 0.22 * Math.sin(t * 1.05 + P[1]) + 0.10 * Math.sin(t * 0.52 + P[3]) + 0.05 * Math.sin(t * 1.73 + P[5]);
      return { x: W * x, y: H * y };
    },
  ];

  const tubePath = TUBE_PATHS[Math.floor(Math.random() * TUBE_PATHS.length)];

  const TRAIL = 9, BANDS = 14, STEPS = 32;

  const TUBE = {
    dark:      { rgb: [228, 178, 100], am: 1.00, fog: 'rgba(14,12,10,0.50)'    },
    'dark-warm':{ rgb: [175, 100,  18], am: 1.45, fog: 'rgba(14,12,10,0.50)'   },
    'dark-blue':{ rgb: [ 40,  70, 220], am: 1.50, fog: 'rgba(9,12,20,0.50)'    },
    'dark-red': { rgb: [190,  25,  45], am: 1.40, fog: 'rgba(18,9,9,0.50)'     },
    light:     { rgb: [228, 178, 100], am: 1.00, fog: 'rgba(255,252,245,0.15)' },
    warm:      { rgb: [175, 100,  18], am: 1.45, fog: 'rgba(253,250,245,0.15)' },
    blue:      { rgb: [ 40,  70, 220], am: 1.50, fog: 'rgba(246,248,255,0.15)' },
    red:       { rgb: [190,  25,  45], am: 1.40, fog: 'rgba(255,247,247,0.15)' },
  };

  function drawTube(ctx, t, lw, maxA, mirror, rgb) {
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tail = t - TRAIL;
    for (let b = 0; b < BANDS; b++) {
      const bp    = b / (BANDS - 1);
      const alpha = Math.pow(bp, 1.7) * maxA;
      const tA    = tail + (b / BANDS) * TRAIL;
      const tB    = tail + ((b + 1) / BANDS) * TRAIL;
      ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
      ctx.beginPath();
      for (let s = 0; s <= STEPS; s++) {
        const { x, y } = tubePath(tA + (s / STEPS) * (tB - tA));
        const px = mirror ? W - x : x;
        s === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.stroke();
    }
  }

  function draw(t) {
    const { rgb, am, fog } = TUBE[root.dataset.theme] || TUBE.dark;
    aC.clearRect(0,0,W,H); drawTube(aC,t,380,0.38*am,false,rgb); drawTube(aC,t,380,0.38*am,true,rgb);
    hC.clearRect(0,0,W,H); drawTube(hC,t,290,0.55*am,false,rgb); drawTube(hC,t,290,0.55*am,true,rgb);
    bC.clearRect(0,0,W,H); drawTube(bC,t,100,0.82*am,false,rgb); drawTube(bC,t,100,0.82*am,true,rgb);
    fC.clearRect(0,0,W,H); fC.fillStyle = fog; fC.fillRect(0,0,W,H);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduced.matches) {
    draw(0); // single static frame, no animation loop
  } else {
    let rafId       = null;
    let animTime    = T_OFFSET;
    let lastStamp   = null;

    function loop(now) {
      if (lastStamp !== null) animTime += (now - lastStamp) * 0.001;
      lastStamp = now;
      draw(animTime);
      rafId = requestAnimationFrame(loop);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = null;
        lastStamp = null; // don't count the gap when we resume
      } else {
        rafId = requestAnimationFrame(loop);
      }
    });

    rafId = requestAnimationFrame(loop);
  }
})();
