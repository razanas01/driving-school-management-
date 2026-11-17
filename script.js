/* ---------- Data (saved in the browser with localStorage) ---------- */
const KEY = 'roadwise_dsms_v2';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);

function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

const s1 = uid(), s2 = uid(), i1 = uid(), i2 = uid(), v1 = uid(), v2 = uid();
const seed = {
  students: [
    { id: s1, name: 'Aarav Sharma', phone: '9876500011', course: 'Beginner', fee: 8000 },
    { id: s2, name: 'Meera Khan', phone: '9876500022', course: 'Test preparation', fee: 5000 }
  ],
  instructors: [
    { id: i1, name: 'R. Verma', phone: '9811100033', speciality: 'Car' },
    { id: i2, name: 'S. Singh', phone: '9811100044', speciality: 'Both' }
  ],
  vehicles: [
    { id: v1, reg: 'UP21 AB 1234', model: 'Maruti Swift', type: 'Car' },
    { id: v2, reg: 'UP21 CD 5678', model: 'Honda Activa', type: 'Two-wheeler' }
  ],
  lessons: [
    { id: uid(), student: s1, instructor: i1, vehicle: v1, date: today(), time: '10:00', status: 'Scheduled' }
  ],
  payments: [
    { id: uid(), student: s1, amount: 3000, method: 'UPI', date: today() }
  ]
};
let db = load() || seed;

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const find = (name, id) => db[name].find(x => x.id === id);
const label = (name, id) => { const x = find(name, id); return x ? (x.name || x.reg) : '—'; };
const paid = id => db.payments.filter(p => p.student === id).reduce((a, p) => a + Number(p.amount), 0);

/* ---------- Table rows for each section ---------- */
const rowCells = {
  students: r => {
    const b = Number(r.fee) - paid(r.id);
    return [esc(r.name), esc(r.phone), esc(r.course), money(r.fee),
      b > 0 ? `<span class="due">${money(b)}</span>` : `<span class="clear">Paid</span>`];
  },
  instructors: r => [esc(r.name), esc(r.phone), esc(r.speciality)],
  vehicles: r => [esc(r.reg), esc(r.model), esc(r.type)],
  lessons: r => [esc(r.date), esc(r.time), esc(label('students', r.student)),
    esc(label('instructors', r.instructor)), esc(label('vehicles', r.vehicle)),
    `<select data-status="${r.id}">${['Scheduled', 'Completed', 'Cancelled']
      .map(o => `<option${o === r.status ? ' selected' : ''}>${o}</option>`).join('')}</select>`],
  payments: r => [esc(r.date), esc(label('students', r.student)), money(r.amount), esc(r.method)]
};
const sortBy = { lessons: r => r.date + r.time, payments: r => r.date };

function drawTable(name) {
  const body = $('rows-' + name);
  const cols = body.closest('table').querySelectorAll('th').length;
  const rows = [...db[name]];
  if (sortBy[name]) rows.sort((a, b) => sortBy[name](a).localeCompare(sortBy[name](b)));
  body.innerHTML = rows.length
    ? rows.map(r => `<tr>${rowCells[name](r).map(c => `<td>${c}</td>`).join('')}
        <td><button class="del" data-name="${name}" data-del="${r.id}">Delete</button></td></tr>`).join('')
    : `<tr><td class="empty" colspan="${cols}">Nothing here yet. Use the form above to add the first record.</td></tr>`;
}

function applyFilter(name) {
  const box = document.querySelector(`[data-search="${name}"]`);
  const q = box.value.trim().toLowerCase();
  $('rows-' + name).querySelectorAll('tr').forEach(tr => {
    const text = [...tr.cells].map(td => {
      const sel = td.querySelector('select');
      return sel ? sel.value : td.textContent;
    }).join(' ').toLowerCase();
    tr.hidden = q !== '' && !text.includes(q);
  });
}

/* ---------- Dashboard, dropdowns and full redraw ---------- */
function drawDashboard() {
  $('st-students').textContent = db.students.length;
  $('st-instructors').textContent = db.instructors.length;
  $('st-vehicles').textContent = db.vehicles.length;
  $('st-collected').textContent = money(db.payments.reduce((a, p) => a + Number(p.amount), 0));
  $('st-pending').textContent = money(db.students.reduce((a, s) => a + Math.max(0, Number(s.fee) - paid(s.id)), 0));
  const todays = db.lessons.filter(l => l.date === today()).sort((a, b) => a.time.localeCompare(b.time));
  $('rows-today').innerHTML = todays.length
    ? todays.map(l => `<tr><td>${esc(l.time)}</td><td>${esc(label('students', l.student))}</td>
        <td>${esc(label('instructors', l.instructor))}</td><td>${esc(label('vehicles', l.vehicle))}</td>
        <td>${esc(l.status)}</td></tr>`).join('')
    : `<tr><td class="empty" colspan="5">No lessons scheduled for today. Add one under Lessons.</td></tr>`;
}

function fillDropdowns() {
  document.querySelectorAll('select[data-ref]').forEach(sel => {
    const keep = sel.value;
    sel.innerHTML = '<option value="">Select…</option>' +
      db[sel.dataset.ref].map(x => `<option value="${x.id}">${esc(x.name || x.reg)}</option>`).join('');
    sel.value = keep;
  });
}

function renderAll() {
  fillDropdowns();
  drawDashboard();
  Object.keys(rowCells).forEach(n => { drawTable(n); applyFilter(n); });
}

/* ---------- Events ---------- */
// Switch between sections
document.querySelector('nav').addEventListener('click', e => {
  const btn = e.target.closest('[data-view]');
  if (!btn) return;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b === btn));
  document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === btn.dataset.view));
});

// Add a record
document.addEventListener('submit', e => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const name = form.dataset.form;
  const rec = { id: uid() };
  new FormData(form).forEach((v, k) => rec[k] = v.trim());

  if (name === 'lessons') {
    rec.status = 'Scheduled';
    const clash = db.lessons.find(l => l.status === 'Scheduled' && l.date === rec.date && l.time === rec.time &&
      (l.instructor === rec.instructor || l.vehicle === rec.vehicle));
    if (clash) { alert('That instructor or vehicle is already booked at this date and time.'); return; }
  }
  db[name].push(rec);
  form.reset();
  save();
  renderAll();
});

// Delete a record
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-del]');
  if (!btn || !confirm('Delete this record?')) return;
  const name = btn.dataset.name, id = btn.dataset.del;
  db[name] = db[name].filter(r => r.id !== id);
  if (name === 'students') {
    db.lessons = db.lessons.filter(l => l.student !== id);
    db.payments = db.payments.filter(p => p.student !== id);
  }
  if (name === 'instructors') db.lessons = db.lessons.filter(l => l.instructor !== id);
  if (name === 'vehicles') db.lessons = db.lessons.filter(l => l.vehicle !== id);
  save();
  renderAll();
});

// Search boxes
document.addEventListener('input', e => {
  if (e.target.dataset.search) applyFilter(e.target.dataset.search);
});

// Change lesson status
document.addEventListener('change', e => {
  const sel = e.target.closest('[data-status]');
  if (!sel) return;
  find('lessons', sel.dataset.status).status = sel.value;
  save();
  drawDashboard();
});

// Start: today's date as the default in date fields
document.querySelectorAll('input[type="date"]').forEach(i => { i.defaultValue = today(); i.value = today(); });
renderAll();