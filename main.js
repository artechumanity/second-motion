// Second Motion portfolio site: the works grid, the work modal with its audio description, and video playback
// that only runs while a video is on screen.
const $ = (id) => document.getElementById(id);
const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
const DURATIONS = { wonder: 110, ovary: 33, girl: 66, stamp: 8, hills: 23, oops: 8, hand: 15, freeart: 1.5, dress: 13, tinman: 17, crown: 4 };
const FEATURED = 'girl';
let works = [];

// Hero and grid videos load and play only while visible (saves data on phones).
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (v.dataset.auto !== 'hover') v.play().catch(() => {});
    } else v.pause();
  }
}, { rootMargin: '120px' });
document.querySelectorAll('.heroArt video').forEach((v) => seen.observe(v));

// Header border once the page scrolls.
addEventListener('scroll', () => $('nav').classList.toggle('scrolled', scrollY > 8), { passive: true });

// The nav stays off-screen until the big hero wordmark has scrolled out of view, so it gets to be the
// first thing people see; then the nav slides down with its own, smaller wordmark.
new IntersectionObserver(([e]) => $('nav').classList.toggle('visible', !e.isIntersecting))
  .observe(document.querySelector('.hero .wordmark'));

const hoverable = matchMedia('(hover: hover)').matches;
function workCard(w, i) {
  const li = document.createElement('li');
  if (w.id === FEATURED) li.className = 'featured';
  const b = document.createElement('button');
  b.className = 'work'; b.setAttribute('aria-label', `${w.title}, number ${w.number}. Open the work and its audio description.`);
  b.innerHTML = `<div class="workMedia"><img alt="" loading="lazy"><video muted loop playsinline preload="none"></video>
    <span class="listen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>Listen</span></div>
    <div class="workCap"><b></b><small></small></div>`;
  b.querySelector('img').src = `img/drawings/${w.id}.jpg`;
  b.querySelector('b').textContent = w.title;
  b.querySelector('small').textContent = `No. ${String(w.number).padStart(2, '0')}`;
  const v = b.querySelector('video');
  v.dataset.src = `media/${w.id}.mp4`;
  if (hoverable) {
    // Desktop: the animation plays while the pointer is over the drawing.
    v.dataset.auto = 'hover';
    b.addEventListener('mouseenter', () => { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); b.classList.add('live'); });
    b.addEventListener('mouseleave', () => { v.pause(); b.classList.remove('live'); });
  } else {
    // Touch: each animation plays while it is on screen.
    v.addEventListener('playing', () => b.classList.add('live'));
    seen.observe(v);
  }
  b.onclick = () => openWork(i);
  li.appendChild(b);
  return li;
}

// --- The work modal
const audio = $('pAudio');
let current = -1, lastFocus = null;
function openWork(i) {
  const w = works[(i + works.length) % works.length];
  current = works.indexOf(w);
  $('mKicker').textContent = `No. ${String(w.number).padStart(2, '0')} · Communication 101`;
  $('mTitle').textContent = w.title;
  $('mDur').textContent = `${DURATIONS[w.id] >= 60 ? fmt(DURATIONS[w.id]) + ' min' : Math.round(DURATIONS[w.id] * 10) / 10 + ' s'} loop`;
  $('mScript').textContent = w.script;
  const v = $('mVideo'); v.src = `media/${w.id}.mp4`; v.play().catch(() => {});
  $('mImg').src = `img/drawings/${w.id}.jpg`; $('mImg').alt = `The drawing ${w.title}`;
  showDrawing(false);
  audio.pause(); audio.src = `audio/${w.id}.m4a`; audio.load(); renderPlayer();
  const prev = works[(current - 1 + works.length) % works.length], next = works[(current + 1) % works.length];
  $('mPrev').querySelector('span').textContent = prev.title; $('mNext').querySelector('span').textContent = next.title;
  if ($('modal').hidden) {
    lastFocus = document.activeElement;
    $('modal').hidden = false; document.body.style.overflow = 'hidden';
    $('mClose').focus();
  }
  $('modal').querySelector('.modalInner').scrollTop = 0;
  history.replaceState(null, '', `#work-${w.id}`);
}
function closeWork() {
  $('modal').hidden = true; document.body.style.overflow = '';
  $('mVideo').pause(); audio.pause();
  history.replaceState(null, '', location.pathname + location.search);
  lastFocus?.focus();
}
function showDrawing(on) {
  $('mVideo').closest('.mStage').classList.toggle('drawing', on);
  $('mShowDraw').setAttribute('aria-pressed', String(on)); $('mShowAnim').setAttribute('aria-pressed', String(!on));
}
$('mShowAnim').onclick = () => showDrawing(false);
$('mShowDraw').onclick = () => showDrawing(true);
$('mClose').onclick = closeWork;
$('mPrev').onclick = () => openWork(current - 1);
$('mNext').onclick = () => openWork(current + 1);
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeWork(); });
addEventListener('keydown', (e) => {
  if ($('modal').hidden) return;
  if (e.key === 'Escape') closeWork();
  else if (e.key === 'ArrowRight') openWork(current + 1);
  else if (e.key === 'ArrowLeft') openWork(current - 1);
});

// Audio description player
function renderPlayer() {
  const playing = !audio.paused;
  $('pIcon').setAttribute('d', playing ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  $('pPlay').setAttribute('aria-label', playing ? 'Pause the audio description' : 'Play the audio description');
  $('pFill').style.width = audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : '0';
  $('pTime').textContent = audio.duration ? `${fmt(audio.currentTime)} / ${fmt(audio.duration)}` : 'Read by a placeholder voice';
}
$('pPlay').onclick = () => (audio.paused ? audio.play().catch(() => {}) : audio.pause());
['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach((ev) => audio.addEventListener(ev, renderPlayer));
$('pBar').onclick = (e) => {
  if (!audio.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};

fetch('works.json').then((r) => r.json()).then((list) => {
  works = list;
  $('grid').replaceChildren(...works.map(workCard));
  const m = location.hash.match(/^#work-(\w+)/);
  if (m) { const i = works.findIndex((w) => w.id === m[1]); if (i >= 0) openWork(i); }
});
