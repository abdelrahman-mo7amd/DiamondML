const API = 'http://localhost:5000';

let CUT_ORDER = [];
let COLOR_ORDER = [];
let CLARITY_ORDER = [];

let sel = { cut: 'Ideal', color: 'E', clarity: 'VVS1' };

async function loadOptions() {
  try {
    const r = await fetch(API + '/options');
    if (!r.ok) throw new Error('API offline');
    const d = await r.json();
    CUT_ORDER = d.cut;
    COLOR_ORDER = d.color;
    CLARITY_ORDER = d.clarity;
    buildPills('pills-cut', d.cut, 'cut', sel.cut);
    buildPills('pills-color', d.color, 'color', sel.color);
    buildPills('pills-clarity', d.clarity,'clarity', sel.clarity);
    const info = await fetch(API + '/');
    if (info.ok) {
      const md = await info.json();
      document.getElementById('badge-txt').textContent = md.model + ' | R²=' + md.r2_score;
      document.getElementById('foot-model').textContent = md.model;
    }
  } catch {
    document.getElementById('badge-txt').textContent = '⚠ API Offline — start Flask first';
  }
}

function buildPills(containerId, values, field, defaultVal) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  values.forEach(v => {
    const btn = document.createElement('button');
    btn.className = 'qpill' + (v === defaultVal ? ' sel' : '');
    btn.textContent = v;
    btn.type = 'button';
    btn.onclick = () => {
      wrap.querySelectorAll('.qpill').forEach(p => p.classList.remove('sel'));
      btn.classList.add('sel');
      sel[field] = v;
      document.getElementById(field).value = v;
    };
    wrap.appendChild(btn);
  });
}

function onSlider(el) {
  const v = parseFloat(el.value);
  document.getElementById('sl-val').textContent = v.toFixed(2) + ' ct';
  const approx = v * 4.43 + 2.0;
  document.getElementById('x').value = (approx).toFixed(2);
  document.getElementById('y').value = (approx - 0.03).toFixed(2);
  document.getElementById('z').value = (v * 2.73 + 1.2).toFixed(2);
  updateFill(el);
}

function updateFill(el) {
  const pct = (el.value - el.min) / (el.max - el.min) * 100;
  el.style.background = `linear-gradient(to right, #7c3aed ${pct}%, #1e1e2a ${pct}%)`;
}
updateFill(document.getElementById('sl-carat'));

const fmt = n => '$' + Math.round(n).toLocaleString('en-US');

function pct(val, order) {
  const i = order.indexOf(val);
  return i === -1 ? 0 : Math.round((i + 1) / order.length * 100);
}

function animateNum(el, target) {
  const start = parseInt(el.textContent.replace(/\D/g,'')) || 0;
  const t0 = performance.now();
  const dur = 700;
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(start + (target - start) * e);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

async function predict() {
  const btn  = document.getElementById('btn');
  const spin = document.getElementById('spin');
  const btxt = document.getElementById('btn-txt');
  const err  = document.getElementById('err');

  const payload = {
    carat:parseFloat(document.getElementById('sl-carat').value),
    cut:sel.cut,
    color:sel.color,
    clarity: sel.clarity,
    depth:parseFloat(document.getElementById('depth').value),
    table:parseFloat(document.getElementById('table').value),
    x:parseFloat(document.getElementById('x').value),
    y:parseFloat(document.getElementById('y').value),
    z:parseFloat(document.getElementById('z').value),
  };

  btn.disabled = true;
  spin.style.display = 'block';
  btxt.textContent = 'Predicting…';
  err.style.display = 'none';

  try {
    const r = await fetch(API + '/predict', {
      method: 'POST',
      headers:{ 'Content-Type': 'application/json' },
      body:JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Prediction failed');

    document.getElementById('ph').style.display  = 'none';
    document.getElementById('res').style.display = 'block';

    animateNum(document.getElementById('pv'), d['Predicted Price']);
    document.getElementById('p-lo').textContent = fmt(d['Price (low)']);
    document.getElementById('p-hi').textContent = fmt(d['Price (high)']);
    document.getElementById('s-r2').textContent = (d['R2 Score'] * 100).toFixed(1) + '%';
    document.getElementById('s-mae').textContent = fmt(d['MAE']);
    document.getElementById('s-ct').textContent = payload.carat.toFixed(2) + ' ct';
    document.getElementById('s-vol').textContent = (payload.x * payload.y * payload.z).toFixed(1);
    document.getElementById('b-cut').style.width= pct(payload.cut,CUT_ORDER)+ '%';
    document.getElementById('b-col').style.width= pct(payload.color,COLOR_ORDER)+ '%';
    document.getElementById('b-cla').style.width = pct(payload.clarity, CLARITY_ORDER) + '%';
    document.getElementById('v-cut').textContent = payload.cut;
    document.getElementById('v-col').textContent = payload.color;
    document.getElementById('v-cla').textContent = payload.clarity;

  } catch (e) {
    err.textContent   = '⚠️ ' + e.message + ' | Make sure Flask API is running (python api/app.py)';
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    spin.style.display = 'none';
    btxt.textContent = '✨ Predict Price';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') predict(); });

loadOptions();