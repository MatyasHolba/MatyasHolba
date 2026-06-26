/* ═══════════════════════════════════════
   ICONS
═══════════════════════════════════════ */
const icons = {
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
};

/* ═══════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════ */
(function() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  let cursorVisible = false;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!cursorVisible) {
      cursorVisible = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
  });
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
    cursorVisible = false;
  });
  document.addEventListener('mouseenter', e => {
    mx = e.clientX; my = e.clientY;
    rx = e.clientX; ry = e.clientY;
    cursorVisible = true;
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  function animRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  document.querySelectorAll('a, button, [role="button"], .project-card, .gallery-cell').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
  document.querySelectorAll('input, textarea, p, .about-bio, .feed-text').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-text'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-text'));
  });
})();

/* ═══════════════════════════════════════
   DATA LOADING
═══════════════════════════════════════ */
async function fetchData() {
  try {
    const r = await fetch('./data.json?' + Date.now());
    if (!r.ok) throw new Error('fetch failed');
    return await r.json();
  } catch(e) {
    console.error('data.json fetch error, falling back to data.js:', e);
    return window.siteData || null;
  }
}

function getAge() {
  return new Date().getFullYear() - 2006;
}

/* ═══════════════════════════════════════
   RENDER FUNCTIONS
═══════════════════════════════════════ */
function renderNav(data) {
  const logo = document.getElementById('nav-logo');
  if (data.meta.initials) logo.textContent = data.meta.initials;

  const ul       = document.getElementById('nav-links');
  const mobileNav = document.getElementById('mobile-nav');
  ul.innerHTML = '';
  if (mobileNav) mobileNav.innerHTML = '';

  (data.meta.navLinks || []).forEach(link => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    li.appendChild(a);
    ul.appendChild(li);

    if (mobileNav) {
      const ma = document.createElement('a');
      ma.href = link.href;
      ma.textContent = link.label;
      ma.addEventListener('click', () => closeMobileNav());
      mobileNav.appendChild(ma);
    }
  });
}

function openMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('nav-hamburger');
  if (!nav || !btn) return;
  nav.classList.add('open');
  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('nav-hamburger');
  if (!nav || !btn) return;
  nav.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function setupMobileNav() {
  const btn = document.getElementById('nav-hamburger');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? closeMobileNav() : openMobileNav();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileNav(); });
  const logo = document.getElementById('nav-logo');
  if (logo) logo.addEventListener('click', () => closeMobileNav());
}

function renderHero(data) {
  const m = data.meta;
  const parts = (m.name || 'Matyáš Holba').split(' ');
  const n1 = document.getElementById('hero-name-1');
  const n2 = document.getElementById('hero-name-2');
  const pabloContainer = document.getElementById('hero-name-pablo');

  if (n1) {
    const text1 = (parts[0] || 'MATYÁŠ').toUpperCase();
    n1.innerHTML = text1.split('').map((c, i) => `<span style="transition-delay:${i*0.03+0.1}s">${c}</span>`).join('');
  }
  if (n2) {
    const text2 = (parts.slice(1).join(' ') || 'HOLBA').toUpperCase();
    n2.innerHTML = text2.split('').map((c, i) => `<span style="transition-delay:${i*0.03}s">${c}</span>`).join('');
  }
  if (pabloContainer) {
    pabloContainer.innerHTML = 'PABLO'.split('').map((c, i) => `<span style="transition-delay:${i*0.04+0.15}s">${c}</span>`).join('');
  }

  const ey = document.getElementById('hero-eyebrow');
  if (ey) ey.textContent = 'Portfolio ' + (m.copyright || new Date().getFullYear());

  const ageEl = document.getElementById('hero-age');
  if (ageEl) ageEl.textContent = getAge();

  const fl = document.getElementById('footer-logo');
  if (fl) {
    const lines = (m.name || 'Matyáš Holba').toUpperCase().split(' ');
    fl.innerHTML = lines[0] + (lines[1] ? `<br><span>${lines[1]}</span>` : '');
  }
}

function renderAbout(data) {
  const el = document.getElementById('about');
  if (!el) return;
  el.style.display = '';

  const bioEl = document.getElementById('bio-text');
  if (bioEl) bioEl.textContent = data.meta.bio || '';

  const pull = document.getElementById('about-pull');
  if (pull) pull.innerHTML = `Stavím věci,<br>které <span class="highlight">fungují.</span>`;

  const img = document.getElementById('about-image');
  if (img) img.innerHTML = `<img src="photos/room.webp" alt="Matyáš Holba" loading="lazy">`;

  const stats = document.getElementById('about-stats');
  if (stats) {
    const items = [
      { num: getAge(),                              label: 'Let' },
      { num: (data.projects || []).length,          label: 'Projektů' },
      { num: (data.techStack || []).length,         label: 'Technologií' },
      { num: new Date().getFullYear() - 2020,       label: 'Let zkušeností' }
    ];
    stats.innerHTML = items.map(s => `
      <div class="about-stat-item">
        <div class="about-stat-num">${s.num}</div>
        <div class="about-stat-label">${s.label}</div>
      </div>`).join('');
  }
}

function renderMarquee(data) {
  const sec   = document.getElementById('marquee-section');
  const track = document.getElementById('marquee-track');
  if (!sec || !track) return;
  const stack = data.techStack || [];
  if (!stack.length) return;
  sec.style.display = '';
  const doubled = [...stack, ...stack, ...stack, ...stack];
  track.innerHTML = doubled.map(t => `
    <span class="marquee-item">
      <span class="marquee-dot"></span>
      ${t}
    </span>`).join('');
}

function renderGoals(data) {
  const el   = document.getElementById('goals');
  const list = document.getElementById('goals-list');
  if (!el || !list) return;
  el.style.display = '';
  const goals = data.goals || [];
  list.innerHTML = goals.map((g, i) => `
    <div class="goal-item reveal">
      <div class="goal-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="goal-text">${g}</div>
      <div class="goal-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </div>`).join('');
}

function renderProjects(data) {
  const el   = document.getElementById('projects');
  const grid = document.getElementById('projects-grid');
  if (!el || !grid) return;
  el.style.display = '';
  const projects  = data.projects || [];
  const statusMap = {
    active:   ['status-active',   'Aktivní'],
    wip:      ['status-wip',      'WIP'],
    archived: ['status-archived', 'Archiv']
  };

  grid.innerHTML = projects.map((p, i) => {
    const [cls, label] = statusMap[p.status] || statusMap.archived;
    const featHtml  = (p.features || []).slice(0, 3).map(f => `<li>${f}</li>`).join('');
    const linkHtml  = p.link
      ? `<a href="${p.link}" class="project-link-btn" target="_blank" rel="noopener">${icons.link} Zobrazit</a>`
      : `<span></span>`;
    const animClass  = i % 2 === 0 ? 'reveal-left' : 'reveal-right';
    const hiddenClass = i >= 5 ? 'hidden-project' : '';
    const loadAttr   = i < 3 ? 'eager' : 'lazy';
    const imgHtml    = p.image
      ? `<div class="project-img-wrap"><img src="${p.image}" alt="${p.title}" loading="${loadAttr}" onload="this.classList.add('loaded')"></div>`
      : '';

    const contentHtml = `
      <div class="project-card-top">
        <div class="project-num">${String(i + 1).padStart(2, '0')}</div>
        <span class="project-status-badge ${cls}">${label}</span>
      </div>
      <div class="project-title">${p.title || ''}</div>
      ${p.description ? `<p class="project-desc">${p.description.substring(0, 160)}${p.description.length > 160 ? '…' : ''}</p>` : ''}
      <ul class="project-features">${featHtml}</ul>
      <div class="project-bottom">
        <div class="project-tags-wrap">${(p.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
        ${linkHtml}
      </div>`;

    if (p.image) return `<div class="project-card featured ${animClass} ${hiddenClass}" id="project-${p.id}">${imgHtml}<div class="project-content">${contentHtml}</div></div>`;
    return `<div class="project-card ${animClass} ${hiddenClass}" id="project-${p.id}"><div class="project-content">${contentHtml}</div></div>`;
  }).join('');

  if (projects.length > 5) {
    const btnWrap = document.createElement('div');
    btnWrap.className = 'load-more-wrap';
    btnWrap.innerHTML = `
      <button class="load-more-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        Zobrazit další projekty
      </button>
    `;
    btnWrap.querySelector('.load-more-btn').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.style.pointerEvents = 'none';
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"/></svg>
        Načítám...`;
      
      setTimeout(() => {
        grid.querySelectorAll('.hidden-project').forEach(el => {
          el.classList.remove('hidden-project');
          setTimeout(() => el.classList.add('visible'), 50);
        });
        btnWrap.style.display = 'none';
        setTimeout(() => {
          if (window.calculateScrollTimeline) {
            window.calculateScrollTimeline();
            if (window._onScroll) window._onScroll();
          }
        }, 150);
      }, 800);
    });
    grid.insertAdjacentElement('afterend', btnWrap);
  }

  grid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top)  / r.height;
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (!card.classList.contains('featured')) {
        card.style.transform = `perspective(900px) rotateX(${(y-.5)*-12}deg) rotateY(${(x-.5)*12}deg) translateY(-5px)`;
      }
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; document.body.classList.remove('cursor-hover'); });
    card.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  });
}

function renderFeed(data) {
  const el   = document.getElementById('feed');
  const list = document.getElementById('feed-list');
  if (!el || !list) return;
  el.style.display = '';
  const feed = data.feed || [];
  list.innerHTML = feed.map((item, i) => `
    <div class="feed-item reveal">
      <div class="feed-meta">
        <div class="feed-index">${String(i+1).padStart(2,'0')}</div>
        <div class="feed-date">${item.date || ''}</div>
      </div>
      <div class="feed-body">
        <p class="feed-text">${item.text || ''}</p>
        ${item.photo ? `<div class="feed-photo"><img src="${item.photo}" alt="" loading="lazy" onload="if(window.calculateScrollTimeline) window.calculateScrollTimeline()"></div>` : ''}
      </div>
    </div>`).join('');
    
  setTimeout(() => {
    if (window.calculateScrollTimeline) window.calculateScrollTimeline();
  }, 100);
}

function renderGallery(data) {
  const el   = document.getElementById('gallery');
  const grid = document.getElementById('gallery-grid');
  if (!el || !grid) return;
  const gallery = data.gallery || [];
  if (!gallery.length) return;
  el.style.display = '';

  let html = '';
  for (let i = 0; i < gallery.length; i += 3) {
    const rowItems = gallery.slice(i, i + 3);
    html += '<div class="gallery-row">';
    html += rowItems.map(img => `
      <div class="gallery-cell">
        <div class="gallery-card" data-caption="${img.caption || ''}" onclick="openLightbox('${img.src}','${(img.caption||'').replace(/'/g,"\\'")}')">
          <img src="${img.src}" alt="${img.caption || ''}" loading="lazy">
        </div>
      </div>`).join('');
    html += '</div>';
  }
  grid.innerHTML = html;

  grid.querySelectorAll('.gallery-cell').forEach(item => {
    item.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    item.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

function renderFooter(data) {
  const socials = document.getElementById('social-links');
  if (socials) {
    socials.innerHTML = (data.socials || []).map(s => `
      <a href="${s.url}" class="social-link" target="_blank" rel="noopener">
        ${icons[s.icon] || icons.link} ${s.label}
      </a>`).join('');
    socials.querySelectorAll('.social-link').forEach(a => {
      a.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      a.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
  const cp = document.getElementById('copyright-text');
  if (cp) cp.textContent = `© ${data.meta.copyright || new Date().getFullYear()} ${data.meta.name || 'Matyáš Holba'}`;
}


function renderContact(data) {
  const el = document.getElementById('contact');
  if (!el) return;
  el.style.display = '';

  const contactContainer = el.querySelector('.contact-card-inner');
  if (!contactContainer) return;

  const socialsHtml = (data.socials || []).map(s => {
    const iconSvg = icons[s.icon] || icons.link;
    const isEmail = s.icon === 'mail' || s.url.startsWith('mailto:');
    const emailClass = isEmail ? 'email-btn' : '';
    return `
      <a href="${s.url}" class="contact-social-btn btn ${emailClass}" target="_blank" rel="noopener">
        ${iconSvg}
        <span>${s.label}</span>
      </a>
    `;
  }).join('');

  contactContainer.innerHTML = `
    <h3 class="contact-title">Máš nápad na projekt?</h3>
    <p class="contact-desc">Nebo se chceš jen na něco zeptat? Neváhej mě kontaktovat přes mé sociální sítě nebo e-mail.</p>
    
    <div class="contact-buttons-wrap">
      ${socialsHtml}
    </div>
  `;

  contactContainer.querySelectorAll('.contact-social-btn').forEach(a => {
    a.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    a.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

function applyVisibility(data) {
  const vis = data.sections || {};
  if (vis.about    === false) document.getElementById('card-about')?.style?.setProperty('display','none','important');
  if (vis.goals    === false && vis.about === false) document.getElementById('card-about')?.style?.setProperty('display','none','important'); // goals are inside card-about
  if (vis.projects === false) document.getElementById('card-projects')?.style?.setProperty('display','none','important');
  if (vis.feed     === false) document.getElementById('card-feed')?.style?.setProperty('display','none','important');
  if (vis.gallery  === false) document.getElementById('card-gallery')?.style?.setProperty('display','none','important');
  if (vis.contact  === false) document.getElementById('card-contact')?.style?.setProperty('display','none','important');

  // Also hide the inner sections just in case
  if (vis.about === false) document.getElementById('about')?.style?.setProperty('display','none','important');
  if (vis.goals === false) document.getElementById('goals')?.style?.setProperty('display','none','important');
  
  let n = 1;
  ['about','goals','projects','feed','gallery','contact'].forEach(id => {
    const el = document.getElementById(id);
    if (el && getComputedStyle(el).display !== 'none') {
      const numEl = document.getElementById(id + '-num');
      if (numEl) numEl.textContent = String(n).padStart(2,'0');
      n++;
    }
  });

  if (data.integrations?.duolingo?.enabled) {
    const duo = document.getElementById('duolingo-widget');
    if (duo) {
      duo.style.display = '';
      const numEl = document.getElementById('duolingo-section-num');
      if (numEl) numEl.textContent = String(n).padStart(2,'0');
      loadDuolingo(data.integrations.duolingo);
    }
    // Also load it for the carousel if it's there
    loadDuolingo(data.integrations.duolingo);
  }
}


/* ═══════════════════════════════════════
   BACKGROUND MUSIC
═══════════════════════════════════════ */
function setupMusic(cfg) {
  if (!cfg || !cfg.enabled || !cfg.url) return;
  let playing = false;
  const audio = new Audio();
  audio.src = cfg.url;
  audio.loop = true;
  audio.volume = cfg.volume !== undefined ? cfg.volume : 0.18;
  audio.preload = 'none';

  function tryPlay() {
    if (playing) return;
    playing = true;
    audio.play().catch(() => { playing = false; });
  }
  document.addEventListener('click',     tryPlay, { once: false });
  document.addEventListener('touchstart', tryPlay, { once: false });
}

/* ═══════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════ */
function openLightbox(src, caption) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = caption || '';
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ═══════════════════════════════════════
   DUOLINGO
═══════════════════════════════════════ */
async function loadDuolingo(cfg) {
  if (!cfg) return;
  try {
    const daysEl = document.getElementById('duo-days');
    if (daysEl) {
      let streak = cfg.startStreak || 0;
      if (cfg.startDate) {
        const start = new Date(cfg.startDate);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        streak += diffDays;
      }
      daysEl.innerHTML = `${streak}<span>dnů</span>`;
    }
    
    const xpEl = document.getElementById('duo-xp');
    if (xpEl) {
      let xp = cfg.xp || 0;
      let xpText = xp > 1000 ? (xp/1000).toFixed(1) + 'k' : xp;
      xpEl.innerHTML = `${xpText}<span>XP</span>`;
    }
    
    const langsEl = document.getElementById('duo-langs');
    if (langsEl) langsEl.innerHTML = `${cfg.league || 'Žádná'}<span>liga</span>`;
    
  } catch(e) {
    console.error('Duolingo error:', e);
  }
}

/* ═══════════════════════════════════════
   SCROLL EFFECTS
═══════════════════════════════════════ */
function setupScrollEffects() {
  const header   = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav-links a');

  const cardNavMap = ['about', 'projects', 'feed', 'gallery', 'contact'];

  function updateNavActive() {
    const idx = window._activeCardIndex;
    if (idx === undefined || idx === -1) {
      navLinks.forEach(a => a.classList.remove('active'));
      return;
    }
    const sectionId = cardNavMap[idx];
    if (!sectionId) return;
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + sectionId);
    });
  }

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 80);
    closeMobileNav();
    const y    = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progressEl = document.getElementById('scroll-progress');
    if (progressEl) progressEl.style.width = (docH > 0 ? (y / docH * 100) : 0) + '%';
    updateNavActive();
  }, { passive: true });
}

/* ═══════════════════════════════════════
   REVEAL ON SCROLL
═══════════════════════════════════════ */
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-up-big, .stagger-children').forEach(el => obs.observe(el));
}

/* ═══════════════════════════════════════
   MOBILE HOVER EFFECTS
═══════════════════════════════════════ */
function setupMobileHoverEffects() {
  if (!window.matchMedia('(hover: none)').matches) return;

  const SELECTORS = ['.project-card','.about-stat-item','.goal-item','.feed-item','.gallery-cell','.social-link','.spec-card'];

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('touch-active', e.isIntersecting));
  }, { rootMargin: '-32% 0px -32% 0px', threshold: 0 });

  SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => obs.observe(el)));
  window._touchHoverObs = obs;
  window._touchHoverSelectors = SELECTORS;
}

function attachTouchHover(root) {
  if (!window._touchHoverObs) return;
  (window._touchHoverSelectors || []).forEach(sel => {
    (root || document).querySelectorAll(sel).forEach(el => window._touchHoverObs.observe(el));
  });
}

/* ═══════════════════════════════════════
   NAV SMOOTH SCROLL
═══════════════════════════════════════ */
function setupNavScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      if (window.scrollToSection) {
        window.scrollToSection(href);
      } else {
        const t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ═══════════════════════════════════════
   ZOOM GUARD
═══════════════════════════════════════ */
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    const zoom = window.outerWidth / window.innerWidth;
    if ((zoom > 1.5 && e.deltaY < 0) || (zoom < 0.7 && e.deltaY > 0)) e.preventDefault();
  }
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && ['+','=','-','_','NumpadAdd','NumpadSubtract'].includes(e.key)) {
    const zoom = window.outerWidth / window.innerWidth;
    const isZoomIn  = ['+','=','NumpadAdd'].includes(e.key);
    const isZoomOut = ['-','_','NumpadSubtract'].includes(e.key);
    if ((zoom > 1.5 && isZoomIn) || (zoom < 0.7 && isZoomOut)) e.preventDefault();
  }
});

/* ═══════════════════════════════════════
   PERFORMANCE CAROUSEL (Gaming section)
═══════════════════════════════════════ */
function initPerfCarousel() {
  const slides = document.querySelectorAll('.perf-slide');
  const dots   = document.querySelectorAll('.perf-dot');
  const track  = document.getElementById('perf-track');
  if (!slides.length || !track) return;

  let currentSlide = 0;
  let autoInterval;

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      clearInterval(autoInterval);
      goToSlide(idx);
      autoInterval = setInterval(() => goToSlide((currentSlide + 1) % slides.length), 6000);
    });
  });

  autoInterval = setInterval(() => goToSlide((currentSlide + 1) % slides.length), 6000);

  const duoDaysEl = document.getElementById('duo-days');
  if (duoDaysEl) {
    const start = new Date('2024-01-01');
    const diff  = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
    duoDaysEl.innerHTML = `${diff}<span>dnů</span>`;
  }
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
async function init() {
  const data = await fetchData();

  if (data) {
    try { renderNav(data); } catch(e) { console.error('renderNav error:', e); }
    try { renderHero(data); } catch(e) { console.error('renderHero error:', e); }
    try { renderAbout(data); } catch(e) { console.error('renderAbout error:', e); }
    try { renderMarquee(data); } catch(e) { console.error('renderMarquee error:', e); }
    try { renderGoals(data); } catch(e) { console.error('renderGoals error:', e); }
    try { renderProjects(data); } catch(e) { console.error('renderProjects error:', e); }
    try { renderFeed(data); } catch(e) { console.error('renderFeed error:', e); }
    try { renderGallery(data); } catch(e) { console.error('renderGallery error:', e); }
    try { renderContact(data); } catch(e) { console.error('renderContact error:', e); }
    try { renderFooter(data); } catch(e) { console.error('renderFooter error:', e); }
    try { applyVisibility(data); } catch(e) { console.error('applyVisibility error:', e); }

    if (window.configureScene)     window.configureScene(data.animation || {});
    setupMusic(data.music || {});
    if (window.buildSceneProjects) window.buildSceneProjects(data.projects || [], data.animation || {});
  }

  setupScrollEffects();
  setupReveal();
  setupNavScroll();
  setupMobileNav();
  initPerfCarousel();

  setTimeout(() => setupMobileHoverEffects(), 100);
}

init();
