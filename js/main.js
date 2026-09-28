/* Pels Pèls — cabells amb física (verlet) que es pentinen amb el cursor */
gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- cortina de cabells ---------- */
(function hair() {
  const cv = $('#hair'), ctx = cv.getContext('2d');
  let W, H, dpr, strands = [];
  const mouse = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, down: false };
  const COLORS = ['#c8894a', '#b3743a', '#d9a066', '#a8672f', '#8f5526', '#e0b27a'];
  function build() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.width = cv.clientWidth * dpr; H = cv.height = cv.clientHeight * dpr;
    const count = Math.round(cv.clientWidth / (cv.clientWidth < 600 ? 5 : 6));
    const SEG = 18;
    strands = [];
    for (let i = 0; i < count; i++) {
      const x0 = (i + Math.random() * .6) / count * W;
      const len = H * (.34 + Math.random() * .22 + .08 * Math.sin(i / count * Math.PI));
      const seg = len / SEG;
      const pts = [];
      for (let j = 0; j <= SEG; j++) pts.push({ x: x0, y: -20 * dpr + j * seg - len * 1.1, ox: x0, oy: -20 * dpr + j * seg - len * 1.1 });
      strands.push({ x0, seg, pts, c: COLORS[i % COLORS.length], w: (1.2 + Math.random() * 1.6) * dpr, sway: Math.random() * 6 });
    }
  }
  build();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  const setM = e => { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; };
  cv.parentElement.addEventListener('pointermove', setM);
  cv.parentElement.addEventListener('pointerdown', setM);
  cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  let part = 1; // raya al medio al entrar: se abre y se relaja
  gsap.to({}, { duration: 3.5, onUpdate() { part = 1 - this.progress(); } });
  const G = .35 * dpr;
  function step(t) {
    const R = 70 * dpr;
    const vx = mouse.x - mouse.px, vy = mouse.y - mouse.py;
    strands.forEach(s => {
      const P = s.pts;
      P[0].x = s.x0; P[0].y = -8 * dpr;
      for (let j = 1; j < P.length; j++) {
        const p = P[j];
        const nx = p.x + (p.x - p.ox) * .96 + Math.sin(t * .9 + s.sway + j * .2) * .03 * dpr;
        const ny = p.y + (p.y - p.oy) * .96 + G;
        p.ox = p.x; p.oy = p.y; p.x = nx; p.y = ny;
        // peine: el cursor aparta y arrastra
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < R) { const f = (R - d) / R; p.x += dx / (d || 1) * f * 6 * dpr + vx * f * .35; p.y += dy / (d || 1) * f * 2 * dpr + vy * f * .2; }
        // raya al medio inicial
        if (part > 0) { const mid = W / 2, side = s.x0 < mid ? -1 : 1, near = 1 - Math.min(1, Math.abs(s.x0 - mid) / (W * .35)); p.x += side * near * part * j * .9 * dpr; }
      }
      for (let k = 0; k < 3; k++) for (let j = 1; j < P.length; j++) {
        const a = P[j - 1], b = P[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, diff = (d - s.seg) / d;
        if (j === 1) { b.x -= dx * diff; b.y -= dy * diff; }
        else { a.x += dx * diff * .5; a.y += dy * diff * .5; b.x -= dx * diff * .5; b.y -= dy * diff * .5; }
      }
    });
    mouse.px = mouse.x; mouse.py = mouse.y;
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    strands.forEach(s => {
      const P = s.pts;
      ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y);
      for (let j = 1; j < P.length - 1; j++) { const mx = (P[j].x + P[j + 1].x) / 2, my = (P[j].y + P[j + 1].y) / 2; ctx.quadraticCurveTo(P[j].x, P[j].y, mx, my); }
      ctx.lineTo(P[P.length - 1].x, P[P.length - 1].y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  let vis = true;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
  gsap.ticker.add(t => { if (!vis) return; step(t); draw(); });
})();
gsap.from('.hero__txt > *', { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .1, delay: 1 });

/* ---------- el mechón que recorre la web ---------- */
(function strand() {
  const wrap = $('.strand-wrap'), svg = $('#strand'), path = $('#strandPath');
  let H = 0, W = 0;
  const size = () => { H = wrap.offsetHeight; W = wrap.offsetWidth; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); };
  size(); addEventListener('resize', size); ScrollTrigger.addEventListener('refresh', size);
  gsap.ticker.add(t => {
    const n = 60, pts = [];
    for (let i = 0; i <= n; i++) {
      const y = i / n * H;
      const x = W * (.5 + .38 * Math.sin(i / n * Math.PI * 5 + .6)) + Math.sin(t * .8 + i * .35) * 14;
      pts.push([x, y]);
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`; }
    path.setAttribute('d', d);
  });
})();

/* ---------- aparicions ---------- */
$$('.idiom > *, .serv h2, .serv article, .duo__img, .duo__txt, .rituals > *, .gal img, .visit > *').forEach(n => {
  gsap.from(n, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 90%' } });
});
