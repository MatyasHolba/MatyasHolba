(function() {
  /* ─────────────────────────────────────────────────────────────
     Apple-style scroll animation:
     • MP4 is pre-decoded into ImageBitmap[] at page load
     • Scroll just indexes into the array — zero decode lag
  ───────────────────────────────────────────────────────────── */
  let configureSceneCalled = false;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let carouselSpeedDeg = 0.25;
  let hologramYOffset  = 48;
  let hologramConfig   = {};
  let sceneEnabled     = true;

  const canvas = document.getElementById('frame-canvas');
  const ctx    = canvas.getContext('2d');
  const vidL1  = document.getElementById('vid-layer1');
  const vidL2  = document.getElementById('vid-layer2');

  let frames1 = [], frames2 = [];
  let ready   = false;
  let targetFrameIdx    = 0;
  let currentFrameFloat = 0;
  let currentFrameIdx   = 0;

  function resizeCanvas() {
    const maxDim = 2560;
    const scale  = Math.min(1, maxDim / Math.max(window.innerWidth, window.innerHeight));
    canvas.width  = Math.floor(window.innerWidth  * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
  }

  function getCharacterLayout() {
    const ar = (frames1 && frames1.length && frames1[0]) 
      ? (frames1[0].width / frames1[0].height) 
      : (1280 / 720);
    
    const cssCanvasW = window.innerWidth;
    const cssCanvasH = window.innerHeight;

    let cssDrawW = cssCanvasW;
    let cssDrawH = cssDrawW / ar;
    if (cssDrawH > cssCanvasH) {
      cssDrawH = cssCanvasH;
      cssDrawW = cssDrawH * ar;
    }

    let zoom = 1.0;
    if (cssCanvasH > cssCanvasW) {
      zoom = 1.70;
    } else {
      zoom = 0.75;
    }
    cssDrawW *= zoom;
    cssDrawH *= zoom;

    const isMobile = cssCanvasW < 768;
    const fscale = isMobile
      ? parseFloat(hologramConfig.frameMobileScale ?? 1)
      : parseFloat(hologramConfig.frameScale ?? 1);
    cssDrawW *= fscale;
    cssDrawH *= fscale;

    const cssDrawY = cssCanvasH - cssDrawH + 10;

    return {
      width: cssDrawW,
      height: cssDrawH,
      y: cssDrawY
    };
  }

  let mtx = 0, mty = 0, mcx = 0, mcy = 0;
  let mx  = window.innerWidth / 2, my = window.innerHeight / 2;
  let smx = mx, smy = my, isHovering = false;

  const trailCanvas = document.getElementById('cursor-trail');
  const trailCtx    = trailCanvas ? trailCanvas.getContext('2d') : null;
  let trailPoints   = [];
  let isCursorOnPage = false;

  function resizeTrail() {
    if (trailCanvas) { trailCanvas.width = canvas.width; trailCanvas.height = canvas.height; }
  }

  resizeCanvas();
  resizeTrail();
  window.addEventListener('resize', () => { resizeCanvas(); resizeTrail(); });

  document.addEventListener('mousemove', e => {
    if (window.innerWidth <= 768) return; // Žádná interakce myší s postavičkou na mobilu!
    mtx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mty = (e.clientY / window.innerHeight - 0.5) * 2;
    mx = e.clientX; my = e.clientY;
    isHovering = true;
    isCursorOnPage = true;
  });
  document.addEventListener('touchstart', e => {
    if (e.touches.length > 0) {
      mx = e.touches[0].clientX;
      my = e.touches[0].clientY;
      isHovering = true;
      isCursorOnPage = true;
    }
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      mx = e.touches[0].clientX;
      my = e.touches[0].clientY;
      isHovering = true;
      isCursorOnPage = true;
    }
  }, { passive: true });
  document.addEventListener('touchend',   () => { isHovering = false; isCursorOnPage = false; });
  /* Desktop: activate layer-2 bubble whenever the mouse is over the document */
  document.addEventListener('mouseenter', () => { isHovering = true; isCursorOnPage = true; });
  document.addEventListener('mouseleave', () => {
    isHovering = false;
    isCursorOnPage = false;
    mtx = 0; mty = 0;
    trailPoints = [];
  });

  /* ── RAF render loop ── */
  function rafLoop(time) {
    requestAnimationFrame(rafLoop);
    mcx += (mtx - mcx) * 0.055;
    mcy += (mty - mcy) * 0.055;

    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / (rect.width  || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const targetX = (mx - rect.left) * scaleX;
    const targetY = (my - rect.top)  * scaleY;

    smx += (targetX - smx) * 0.12;
    smy += (targetY - smy) * 0.12;

    if (trailCtx) {
      trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      if (isCursorOnPage) trailPoints.push({ x: mx, y: my, age: 0 });
      for (let i = 1; i < trailPoints.length; i++) {
        const p1 = trailPoints[i - 1], p2 = trailPoints[i];
        const opacity = 1 - (p2.age / 30);
        if (opacity <= 0) continue;
        trailCtx.beginPath();
        trailCtx.moveTo(p1.x, p1.y);
        trailCtx.lineTo(p2.x, p2.y);
        trailCtx.lineCap = 'round';
        trailCtx.lineWidth = 3 + (opacity * 2);
        trailCtx.strokeStyle = `rgba(93,255,145,${opacity * 0.6})`;
        trailCtx.stroke();
        p2.age++;
      }
      if (trailPoints.length > 0) trailPoints[0].age++;
      trailPoints = trailPoints.filter(p => p.age < 30);
    }

    const t     = time / 1000;
    const idleY = Math.sin(t * 0.62) * 3.2;
    const rotX  = mcy * 0.2 + Math.cos(t * 0.22) * 0.4;
    const rotY  = mcx * 0.2 + Math.sin(t * 0.28) * 0.4; // Méně intenzivní rotace
    const transX = -mcx * 2; // Minimalizace pohybu do stran (max 2px)
    const transY = -mcy * 2; // Minimalizace pohybu nahoru/dolů
    const scl   = 1 + Math.sin(t * 0.4)*0.01;
    
    canvas.style.transform = `perspective(1400px) rotateY(${rotY}deg) translate(${transX}px,${transY}px) scale(${scl})`;

    const maxIdx = Math.max(0, frames1.length - 1);
    targetFrameIdx = Math.min(Math.floor(window.idealTargetF || 0), maxIdx);
    currentFrameFloat += (targetFrameIdx - currentFrameFloat) * 0.08;
    currentFrameIdx    = Math.round(currentFrameFloat);

    if (!ready || !frames1.length) return;

    const frame1    = frames1[currentFrameIdx];
    const frame2src = frames2[Math.min(currentFrameIdx, frames2.length - 1)];
    if (!frame1) return;

    const ar  = frame1.width / frame1.height;
    let drawW = canvas.width;
    let drawH = drawW / ar;
    if (drawH > canvas.height) { drawH = canvas.height; drawW = drawH * ar; }

    let zoom = 1.0;
    if (canvas.height > canvas.width) {
      zoom = 1.70; // Zvětšení na telefonu
    } else {
      zoom = 0.75; // Zmenšení na počítači
    }
    drawW *= zoom; drawH *= zoom;

    const isMobile = window.innerWidth < 768;
    const fscale   = isMobile
      ? parseFloat(hologramConfig.frameMobileScale ?? 1)
      : parseFloat(hologramConfig.frameScale       ?? 1);
    drawW *= fscale; drawH *= fscale;

    const prxX = mcx * 3;
    const prxY = mcy * 3;
    let drawX  = (canvas.width  - drawW) / 2 + prxX;
    let drawY  = canvas.height - drawH + 10 + prxY;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw layer 1 with a supporting soft white glow that traces only the subject silhouette
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 32;
    ctx.drawImage(frame1, drawX, drawY, drawW, drawH);
    ctx.restore();

    if (isHovering && frame2src) {
      const numPts = 60, baseR = 160;
      let offCanvas = document.getElementById('scene-mask-canvas');
      if (!offCanvas) {
        offCanvas = document.createElement('canvas');
        offCanvas.id = 'scene-mask-canvas';
        offCanvas.style.display = 'none';
        document.body.appendChild(offCanvas);
      }
      if (offCanvas.width !== canvas.width || offCanvas.height !== canvas.height) {
        offCanvas.width = canvas.width; offCanvas.height = canvas.height;
      }
      const octx = offCanvas.getContext('2d');
      octx.clearRect(0, 0, offCanvas.width, offCanvas.height);

      octx.save();
      octx.filter = 'blur(15px)';
      octx.fillStyle = '#fff';
      octx.beginPath();
      for (let i = 0; i <= numPts; i++) {
        const a = (i / numPts) * Math.PI * 2;
        const glAngle = Math.atan2(-Math.sin(a), Math.cos(a));
        const rOff = Math.sin(glAngle * 4.0 + t * 2.0) * 15.0 + Math.cos(glAngle * 3.0 - t * 1.5) * 15.0;
        const r  = baseR - rOff;
        const px = smx + Math.cos(a) * r;
        const py = smy + Math.sin(a) * r;
        if (i === 0) octx.moveTo(px, py); else octx.lineTo(px, py);
      }
      octx.closePath(); octx.fill();
      octx.globalCompositeOperation = 'source-in';
      octx.filter = 'none';
      octx.drawImage(frame2src, drawX, drawY, drawW, drawH);
      octx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.filter = 'blur(15px)';
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      for (let i = 0; i <= numPts; i++) {
        const a = (i / numPts) * Math.PI * 2;
        const glAngle = Math.atan2(-Math.sin(a), Math.cos(a));
        const rOff = Math.sin(glAngle * 4.0 + t * 2.0) * 15.0 + Math.cos(glAngle * 3.0 - t * 1.5) * 15.0;
        const r  = baseR - rOff;
        const px = smx + Math.cos(a) * r;
        const py = smy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(offCanvas, 0, 0);
    }

    /* Mobile post-processing */
    const isMobilePortrait2 = canvas.height > canvas.width;
    const mode2 = parseInt(hologramConfig.mobileLayoutMode) || 1;
    if (isMobilePortrait2) {
      const YScroll = window.scrollY;
      const fadeDistance = S_hero || window.innerHeight;
      const textOpacity = Math.max(0, 1 - YScroll / (fadeDistance * 0.4)); // Fades out completely when scrolled 40% of the screen height

      if (mode2 === 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const grad = ctx.createLinearGradient(0, drawY + drawH * 0.5, 0, drawY + drawH * 0.85);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, drawY, canvas.width, drawH);
        ctx.restore();
      } else if (mode2 === 3 && textOpacity > 0) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.floor(canvas.width * 0.175);
        const cutOffY  = drawY + drawH * 0.84;
        ctx.shadowColor   = `rgba(0,0,0,${0.12 * textOpacity})`;
        ctx.shadowBlur    = 25;
        ctx.shadowOffsetY = 8;
        ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(255,255,255,${textOpacity})`;
        ctx.fillText('MATYÁŠ', canvas.width / 2, cutOffY);
        ctx.shadowBlur    = 10;
        ctx.shadowOffsetY = 4;
        ctx.font = '800 15px "Inter", sans-serif';
        ctx.fillStyle = `rgba(180,180,185,${0.9 * textOpacity})`;
        ctx.letterSpacing = '14px';
        ctx.fillText('PORTFOLIO', canvas.width / 2 + 7, cutOffY + fontSize * 0.65);
        ctx.restore();
      }
    }
  }
  requestAnimationFrame(rafLoop);

  /* ── Loading helpers ── */
  function setProgress(pct) {
    const bar = document.querySelector('.load-bar-fill');
    if (bar) bar.style.width = (pct * 100) + '%';
  }
  function hideLoadOverlay() {
    const loader = document.getElementById('loading');
    if (loader && !loader.classList.contains('out')) {
      loader.classList.add('out');
      setTimeout(() => loader.remove(), 800);
    }
  }

  /* ── Wait for video metadata ── */
  function waitForMeta(vid) {
    return new Promise(resolve => {
      if (vid.readyState >= 1) { resolve(); return; }
      const t = setTimeout(resolve, 8000);
      vid.onloadedmetadata = () => { clearTimeout(t); resolve(); };
      vid.onerror          = () => { clearTimeout(t); resolve(); };
    });
  }

  /* ── Pre-decode MP4 → ImageBitmap[] (Apple-style) ── */
  async function decodeVideoFromURL(url, framesArray, onProgress, onFirstFrame) {
    let blobUrl = url;
    try {
      const cache = await caches.open('mp4-cache-v1');
      const resp = await cache.match(url);
      if (resp && resp.ok) {
        blobUrl = URL.createObjectURL(await resp.blob());
      } else {
        // Not in cache. Fetch in background to cache for next visit.
        fetch(url).then(r => { if (r.ok) cache.put(url, r.clone()); }).catch(()=>{});
        // We use the raw 'url' for blobUrl to avoid blocking the first frame!
      }
    } catch { /* fallback to streaming URL */ }

    const vid = document.createElement('video');
    vid.muted       = true;
    vid.playsInline = true;
    vid.preload     = 'auto';
    vid.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(vid);
    vid.src = blobUrl;
    vid.load();

    await new Promise(resolve => {
      if (vid.readyState >= 3) { resolve(); return; }
      const t = setTimeout(resolve, 12000);
      vid.oncanplay        = () => { clearTimeout(t); resolve(); };
      vid.oncanplaythrough = () => { clearTimeout(t); resolve(); };
      vid.onerror          = () => { clearTimeout(t); resolve(); };
    });

    const dur = (isFinite(vid.duration) && vid.duration > 0) ? vid.duration : 4;
    const { skipFrames = 0, frameStep = 1, knownTotal = 0 } = (decodeVideoFromURL._opts || {});
    const total      = knownTotal > 0 ? knownTotal : Math.round(dur * 25);
    const usable     = Math.max(total - skipFrames, 1);
    const frameCount = Math.ceil(usable / frameStep);

    const w = vid.videoWidth || 1280, h = vid.videoHeight || 720;
    const cap = document.createElement('canvas');
    cap.width = w; cap.height = h;
    const capCtx = cap.getContext('2d');

    for (let i = 0; i < frameCount; i++) {
      let frameIdx  = skipFrames + i * frameStep;
      if (i === frameCount - 1) frameIdx = total - 1; // Force the very last frame to reach the end of the video!
      vid.currentTime = Math.min((frameIdx / total) * dur, dur * 0.999);

      await new Promise(resolve => {
        let done = false;
        const t = setTimeout(() => { done = true; resolve(); }, 400);
        vid.onseeked = () => { if (done) return; clearTimeout(t); done = true; resolve(); };
      });

      try {
        capCtx.clearRect(0, 0, w, h);
        capCtx.drawImage(vid, 0, 0, w, h);
        framesArray[i] = await createImageBitmap(cap);
      } catch {
        framesArray[i] = framesArray[Math.max(0, i - 1)] ?? null;
      }
      onProgress && onProgress((i + 1) / frameCount);
      if (i === 0 && onFirstFrame) onFirstFrame();
      await new Promise(r => setTimeout(r, 0));
    }

    vid.src = '';
    document.body.removeChild(vid);
    if (blobUrl !== url) URL.revokeObjectURL(blobUrl);
    
    // Fill any missing nulls at the end
    const first = framesArray.find(Boolean);
    for (let i=0; i<frameCount; i++) {
        if (!framesArray[i]) framesArray[i] = framesArray[i-1] ?? first;
    }
  }

  /* ── Load PNG frame images (legacy frames/ mode) ── */
  async function loadFrameImages(layer, frameCount, onProgress, cacheVer, framesArray, onFirstFrame) {
    const folder = layer === 1 ? 'first_layer' : 'second_layer';
    let cache = null;
    try { cache = await caches.open('frames-v-' + cacheVer); } catch {}
    let done = 0;
    
    // Sequential load to allow first frame fast exit
    for (let i = 0; i < frameCount; i++) {
      const url = `frames/${folder}/frame_${String(i).padStart(4,'0')}.png`;
      let src = url;
      try {
        if (cache) {
          let resp = await cache.match(url);
          if (!resp) { resp = await fetch(url); if (resp.ok) await cache.put(url, resp.clone()); }
          if (resp && resp.ok) src = URL.createObjectURL(await resp.blob());
        }
      } catch {}
      await new Promise(resolve => {
        const img = new Image();
        img.onload  = async () => { try { framesArray[i] = await createImageBitmap(img); } catch { framesArray[i] = img; } resolve(); };
        img.onerror = () => resolve();
        img.src = src;
      });
      onProgress && onProgress(++done / frameCount);
      if (i === 0 && onFirstFrame) onFirstFrame();
      await new Promise(r => setTimeout(r, 0));
    }
    const first = framesArray.find(Boolean);
    for (let i=0; i<frameCount; i++) {
        if (!framesArray[i]) framesArray[i] = framesArray[i-1] ?? first;
    }
  }

  /* ── Init: load + pre-decode ── */
  async function initAnimation(cfg) {
    setProgress(0);
    const mode     = cfg.animationMode || 'mp4';
    const cacheVer = cfg.cacheVersion  || 'v1';

    try {
      const keys = await caches.keys();
      for (const k of keys) { if (k.startsWith('frames-v-') && k !== 'frames-v-' + cacheVer) await caches.delete(k); }
    } catch {}

    const pFirst1 = new Promise(r => { initAnimation.onF1 = r; });
    const pFirst2 = new Promise(r => { initAnimation.onF2 = r; });
    
    frames1 = []; frames2 = [];

    if (mode === 'frames') {
      const totalFrames = cfg.totalFrames || 93;
      window.expectedFrames = totalFrames;
      let p1 = 0, p2 = 0;
      const upd = () => setProgress((p1 + p2) / 2);
      
      // Start background tasks
      loadFrameImages(1, totalFrames, p => { p1 = p; upd(); }, cacheVer, frames1, initAnimation.onF1);
      loadFrameImages(2, totalFrames, p => { p2 = p; upd(); }, cacheVer, frames2, initAnimation.onF2);
    } else {
      const src1 = cfg.layer1Video ? `frames/${cfg.layer1Video}` : 'frames/1.mp4';
      const src2 = cfg.layer2Video ? `frames/${cfg.layer2Video}` : 'frames/2.mp4';
      setProgress(0.02);
      
      let fStep = 2;
      if (window.perfGrade === 'low') fStep = 4;
      else if (window.perfGrade === 'high') fStep = 1;
      
      const totalFramesConfig = cfg.totalFrames || 60;
      window.expectedFrames = Math.ceil(totalFramesConfig / fStep);
      decodeVideoFromURL._opts = { skipFrames: 0, frameStep: fStep, knownTotal: totalFramesConfig };
      
      let p1 = 0, p2 = 0;
      const updPar = () => setProgress(0.02 + ((p1 + p2) / 2) * 0.96);
      
      const safeDecode = async (src, framesArr, progressFn, firstFn) => {
        try {
          await decodeVideoFromURL(src, framesArr, progressFn, firstFn);
        } catch (err) {
          console.warn("Failed to decode video frame layer:", src, err);
          firstFn(); // prevent hanging
        }
      };
      
      // Start background decoding
      safeDecode(src1, frames1, p => { p1 = p; updPar(); }, initAnimation.onF1);
      safeDecode(src2, frames2, p => { p2 = p; updPar(); }, initAnimation.onF2);
    }

    // Wait ONLY for the first frame of each layer
    await Promise.all([pFirst1, pFirst2]);

    ready = true;
    setProgress(1);
    hideLoadOverlay();
    onScroll();
  }

  /* ── Scroll Timeline ── */
  let S_hero = 0, S_intro = 0, scrollData = [], S_total = 0;

  function calculateScrollTimeline() {
    if (!sceneEnabled) return;
    const V = window.innerHeight;
    S_hero  = V;
    S_intro = S_hero + V * 0.5;
    let currentY = S_intro;
    scrollData   = [];

    const cardElements = [
      document.getElementById('card-about'),
      document.getElementById('card-projects'),
      document.getElementById('card-feed'),
      document.getElementById('card-gallery'),
      document.getElementById('card-contact')
    ];

    cardElements.forEach((el) => {
      if (!el) return;
      const content = el.querySelector('.hologram-card-content');
      if (!content) return;

      const originalDisplay = el.style.display;
      el.style.visibility = 'hidden';
      el.style.display    = 'flex';
      el.classList.add('active');
      const sections = el.querySelectorAll('section');
      sections.forEach(s => s.style.display = 'block');
      const contentScrollable = content.scrollHeight;
      el.classList.remove('active');
      el.style.display    = originalDisplay;
      el.style.visibility = '';

      const rotationStart = currentY;
      const rotationEnd   = rotationStart + V * 0.5;
      const zoomInStart   = rotationEnd;
      const zoomInEnd     = zoomInStart  + V * 0.75;
      
      let nativeScrollDistance = Math.max(0, contentScrollable - V + 60);
      if (el.id === 'card-contact') {
        nativeScrollDistance = Math.max(0, nativeScrollDistance - 60); // Do not add 60px padding for contact card if not needed
      }
      
      const scrollEnd     = zoomInEnd + nativeScrollDistance;
      const zoomOutEnd    = scrollEnd + V * 0.75;

      scrollData.push({ el, content, nativeScrollDistance, rotationStart, rotationEnd, zoomInStart, zoomInEnd, scrollEnd, zoomOutEnd });
      currentY = zoomOutEnd;

      // Pre-apply .visible so reveals are instant when card expands
      content.querySelectorAll(
        '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-up-big, .stagger-children'
      ).forEach(function(revEl) { revEl.classList.add('visible'); });
    });

    S_total = currentY;
    const ghost = document.getElementById('scroll-ghost');
    if (ghost) ghost.style.height = Math.max(0, S_total - V) + 'px';
  }
  window.calculateScrollTimeline = calculateScrollTimeline;
  window._onScroll = function() { onScroll(); };

  window.scrollToSection = function(href) {
    if (href === '#links') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    const id = href.replace('#', '');
    const index = scrollData.findIndex(d => d.el.id === 'card-' + id || d.el.querySelector('#' + id));
    if (index !== -1) {
      window.scrollTo({ top: scrollData[index].zoomInEnd + 20, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  function onScroll() {
    if (!sceneEnabled) return;
    const Y = window.scrollY;
    const V = window.innerHeight;

    const heroLeft   = document.querySelector('.hero-left');
    const heroPhoto  = document.querySelector('.hero-photo-col');
    const fixedCanvas = document.getElementById('fixed-canvas-container');

    /* 1. INITIAL PARALLAX AND STICKY HERO */
    const heroBgText = document.querySelector('.background-text');
    if (heroBgText) heroBgText.style.opacity = Math.max(0, 1 - Y / 300);

    if (Y <= S_hero) {
      const p = Y / (S_hero || 1);
      const isMobile = window.innerWidth < 768;
      if (heroLeft) {
        const translateX = isMobile ? 0 : p * -(window.innerWidth * 0.6); // Jde ostře do levé strany
        const translateY = 0; // Žádný pohyb nahoru, jak sis přál!
        const scale = 1 - (p * 0.4); 
        heroLeft.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        heroLeft.style.transformOrigin = 'left center'; // Zmenšuje se a zůstane ve svém rohu
        heroLeft.style.opacity = 1;
      }
      if (heroPhoto) { 
        const translateX = isMobile ? 0 : p * (window.innerWidth * 0.6);
        heroPhoto.style.transform = `translateX(${translateX}px) scale(${1 - p * 0.2})`;  
        heroPhoto.style.opacity = 1 - (p * 1.5); 
      }
      if (fixedCanvas) { fixedCanvas.style.opacity = p; fixedCanvas.style.transform = `scale(${0.8 + 0.2 * p})`; }
    } else {
      if (heroLeft) {
        heroLeft.style.opacity = 0; // Zcela skryjeme, aby nápis nepřekážel za kartami
      }
      if (heroPhoto) { heroPhoto.style.opacity = 0; heroPhoto.style.transform = `translateX(${window.innerWidth * 0.6}px)`; }
      if (fixedCanvas) { fixedCanvas.style.opacity = 1; fixedCanvas.style.transform = 'scale(1)'; }
    }

    /* 2. CHARACTER ANIMATION */
    let targetF = 0;
    const expFrames = window.expectedFrames || 60;
    if (Y <= S_hero)                         targetF = 0;
    else if (Y > S_hero && Y <= S_intro)     targetF = ((Y - S_hero) / V) * expFrames;
    else                                     targetF = expFrames;
    window.idealTargetF = targetF;

    /* 3. CAROUSEL & CARDS */
    let activeCardIndex = -1;
    const totalCards    = scrollData.length;
    const stepAngle     = 360 / totalCards;
    let globalRotation  = 0;

    scrollData.forEach((card, i) => {
      if (Y >= card.rotationStart && Y <= card.zoomOutEnd) activeCardIndex = i;
      if (Y >= card.rotationStart && Y <= card.rotationEnd) {
        const p    = (Y - card.rotationStart) / (card.rotationEnd - card.rotationStart || 1);
        const ease = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2,2)/2;
        globalRotation = (i - 1 + ease) * stepAngle;
      } else if (Y > card.rotationEnd && Y <= card.zoomOutEnd) {
        globalRotation = i * stepAngle;
      }
    });

    if (activeCardIndex === -1 && Y > S_intro) globalRotation = (totalCards - 1) * stepAngle;

    window._activeCardIndex = activeCardIndex;

    // Trigger reveal animations when a card is fully expanded
    scrollData.forEach((card, i) => {
      if (activeCardIndex === i && Y >= card.zoomInEnd && !card._revealsTriggered) {
        card._revealsTriggered = true;
        card.content.querySelectorAll(
          '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-up-big, .stagger-children'
        ).forEach(el => el.classList.add('visible'));
      }
    });

    scrollData.forEach((card, i) => {
      let angle = (i * stepAngle - globalRotation) % 360;
      if (angle > 180)  angle -= 360;
      if (angle < -180) angle += 360;

      // 3D placement: cards orbit in a circle (Cylinder / Mlýnek)
      const rad = angle * Math.PI / 180;
      const R   = Math.min(window.innerWidth * 0.15, 200); // Orbit radius
      const tx = Math.sin(rad) * R;
      const tz = Math.cos(rad); // tz ranges from 1 (front) to -1 (back)

      let scale   = 0.15 + 0.15 * tz; // Front cards: scale ~0.3, Back cards: ~0.0
      let opacity = 0.3 + 0.7 * tz;   // Back cards will be completely transparent (-0.4)
      if (opacity < 0) opacity = 0;
      if (opacity > 1) opacity = 1;
      
      let zIndex  = 150 + Math.floor(100 * tz); // Front cards are on top
      
      // Calculate dynamic hand position:
      const isMobile = window.innerWidth <= 768;
      const layout = getCharacterLayout();
      const handsRatio = isMobile ? 0.58 : 0.65;
      const targetYCenter = layout.y + layout.height * handsRatio;
      const handY = targetYCenter - (window.innerHeight / 2);
      
      let finalTranslateY = handY;
      let finalTranslateX = tx;
      let innerTranslateY = 0;
      let isExpanding     = false;

      // Dimensions for seamless expansion, using dark theme
      const isContact = card.el.id === 'card-contact';
      let cardWidth = 280;
      let cardHeight = 400;
      let cardRadius = 20;
      let contentBg = 'rgba(10,10,12,0.95)'; // Tmavý design pro karty!

      let targetMaxWidth = isContact ? Math.min(500, window.innerWidth - 40) : window.innerWidth;
      let targetMaxHeight = isContact ? Math.min(600, window.innerHeight - 80) : window.innerHeight;
      let targetRadius = isContact ? 24 : 0;
      let targetBg = isContact ? 'rgba(10, 10, 12, 0.85)' : '#0a0a0c';

      if (activeCardIndex === i && Y > card.rotationEnd) {
        if (Y <= card.zoomInEnd) {
          isExpanding = true;
          const p    = (Y - card.zoomInStart) / (card.zoomInEnd - card.zoomInStart || 1);
          const ease = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2,2)/2;
          
          cardWidth = 280 + (targetMaxWidth - 280) * ease;
          cardHeight = 400 + (targetMaxHeight - 400) * ease;
          cardRadius = 20 + (targetRadius - 20) * ease;
          contentBg = isContact 
            ? `rgba(10,10,12,${0.8 + 0.05 * ease})` 
            : `rgba(10,10,12,${0.95 + 0.05 * ease})`;

          scale = 0.3 * (1 - ease) + 1 * ease;
          finalTranslateX = tx * (1 - ease);
          finalTranslateY = handY * (1 - ease);
          opacity = 1; zIndex = 300;
        } else if (Y <= card.scrollEnd) {
          isExpanding = true; scale = 1; finalTranslateX = 0; finalTranslateY = 0; opacity = 1; zIndex = 300;
          cardWidth = targetMaxWidth; cardHeight = targetMaxHeight; cardRadius = targetRadius; contentBg = targetBg;
          const p = (Y - card.zoomInEnd) / (card.scrollEnd - card.zoomInEnd || 1);
          innerTranslateY = -p * card.nativeScrollDistance;
        } else if (Y <= card.zoomOutEnd) {
          isExpanding = true;
          const p    = (Y - card.scrollEnd) / (card.zoomOutEnd - card.scrollEnd || 1);
          const ease = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2,2)/2;
          
          cardWidth = targetMaxWidth - (targetMaxWidth - 280) * ease;
          cardHeight = targetMaxHeight - (targetMaxHeight - 400) * ease;
          cardRadius = targetRadius + (20 - targetRadius) * ease;
          contentBg = isContact 
            ? `rgba(10,10,12,${0.85 - 0.05 * ease})` 
            : `rgba(10,10,12,${1 - 0.05 * ease})`;

          scale = 1 * (1 - ease) + 0.3 * ease;
          finalTranslateX = tx * ease;
          finalTranslateY = handY * ease;
          opacity = 1; zIndex = 300;
          innerTranslateY = -card.nativeScrollDistance;
        }
      }

      if (Y <= S_intro || !isExpanding) {
        card.el.style.pointerEvents = 'none';
        card.content.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)'; // Darker shadow for dark card
      } else {
        card.el.style.pointerEvents = 'auto';
        card.content.style.boxShadow = 'none';
      }
      
      // FIX INITIAL STATE BUG: Hide all cards completely before carousel starts
      if (Y <= S_intro) {
        opacity = 0;
      }

      card.el.style.zIndex    = zIndex;
      card.el.style.opacity   = opacity;
      card.el.style.transform = `translate(${finalTranslateX}px,${finalTranslateY}px) scale(${scale})`;
      
      card.content.style.width = cardWidth + 'px';
      card.content.style.height = cardHeight + 'px';
      card.content.style.borderRadius = cardRadius + 'px';
      card.content.style.background = contentBg;

      /* visibility: the CSS default is hidden — must toggle .active to show the card */
      card.el.classList.toggle('active', opacity > 0.01);
      Array.from(card.content.children).forEach(child => {
        child.style.transform = `translateY(${innerTranslateY}px)`;
      });
    });

    /* 4. DYNAMIC BACKGROUND TEXT */
    const bgText = document.getElementById('scene-bg-text');
    if (bgText) {
      let frontCardIndex = Math.round(globalRotation / stepAngle);
      if (frontCardIndex < 0) frontCardIndex = 0;
      if (frontCardIndex > totalCards - 1) frontCardIndex = totalCards - 1;

      const textLabels = ['ABOUT ME','PROJECTS','FEED','GALLERY','CONTACT'];
      const targetText  = textLabels[frontCardIndex] || 'ABOUT ME';

      if (bgText.dataset.currentText !== targetText) {
        if (!bgText.dataset.currentText) {
          // First load, don't animate transition
          bgText.dataset.currentText = targetText;
          bgText.innerHTML = targetText.split('').map((char, i) => {
            const len        = targetText.length;
            const normalized = Math.abs((i / (len - 1 || 1)) - 0.5) * 2;
            const scale      = 1 + Math.pow(normalized, 2) * 0.8;
            return `<span style="transform:scaleY(${scale.toFixed(2)})">${char === ' ' ? '&nbsp;' : char}</span>`;
          }).join('');
        } else {
          // Transition animate
          bgText.dataset.currentText = targetText;
          bgText.classList.add('transitioning');
          setTimeout(() => {
            bgText.innerHTML = targetText.split('').map((char, i) => {
              const len        = targetText.length;
              const normalized = Math.abs((i / (len - 1 || 1)) - 0.5) * 2;
              const scale      = 1 + Math.pow(normalized, 2) * 0.8;
              return `<span style="transform:scaleY(${scale.toFixed(2)})">${char === ' ' ? '&nbsp;' : char}</span>`;
            }).join('');
            // Trigger reflow to restart transition
            bgText.offsetHeight;
            bgText.classList.remove('transitioning');
          }, 200);
        }
      }
      if (Y > S_intro) bgText.classList.add('visible');
      else             bgText.classList.remove('visible');
    }

    if (Y >= S_total - V * 0.5) document.body.classList.remove('scene-active');
    else                         document.body.classList.add('scene-active');
  }

  /* ── Configure (called after data.json loads) ── */
  window.configureScene = function(cfg) {
    configureSceneCalled = true;
    if (!cfg) return;
    if (cfg.enabled === false) {
      sceneEnabled = false;
      document.getElementById('fixed-canvas-container').style.display = 'none';
      document.getElementById('scroll-ghost').style.display = 'none';
      return;
    }
    hologramConfig = cfg;
    calculateScrollTimeline();
    initAnimation(cfg);
  };

  document.body.classList.add('scene-active');

  let ticking = false;
  window.addEventListener('scroll', () => {
    const loader = document.getElementById('loading');
    if (loader && !loader.classList.contains('out')) {
      window.scrollTo(0, 0);
      return;
    }
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', () => { resizeCanvas(); calculateScrollTimeline(); onScroll(); });

  setTimeout(() => {
    if (!configureSceneCalled) {
      calculateScrollTimeline();
      initAnimation({ animationMode: 'mp4', layer1Video: '1.mp4', layer2Video: '2.mp4' });
    }
  }, 3500);

})();
