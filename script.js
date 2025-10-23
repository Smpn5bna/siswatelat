console.log("✅ script.js aktif!");
// === SMP Negeri 5 Banda Aceh — Keterlambatan Online ===
// v9 — Integrasi Google Sheets + perbaikan tampilan data siswa + loading info
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwZUJk2sRag2cO6z8ayYqOGt-co--VWz0oWskTzsMaHCRLgSkxtjPdLc-MxnxG4AlZA/exec';

// LocalStorage backup (cadangan offline)
const KEY_STUDENTS = 'lts_v9_students';
const KEY_LATE = 'lts_v9_late';

let students = JSON.parse(localStorage.getItem(KEY_STUDENTS) || '[]');
let lateness = JSON.parse(localStorage.getItem(KEY_LATE) || '[]');

// Elemen
const pasteBox = document.getElementById('pasteBox');
const btnProcessPaste = document.getElementById('btnProcessPaste');
const btnClearStudents = document.getElementById('btnClearStudents');
const classSummary = document.getElementById('classSummary');
const classList = document.getElementById('classList');
const selectClassForInput = document.getElementById('selectClassForInput');
const studentSelect = document.getElementById('studentSelect');
const tanggalInput = document.getElementById('tanggal');
const jamInput = document.getElementById('jam');
const alasanInput = document.getElementById('alasan');
const saveLatenessBtn = document.getElementById('saveLateness');
const exportMonthlyCsv = document.getElementById('exportMonthlyCsv');
const downloadPdf = document.getElementById('downloadPdf');
const searchQ = document.getElementById('searchQ');
const filterKelas = document.getElementById('filterKelas');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const btnFilter = document.getElementById('btnFilter');
const btnResetFilter = document.getElementById('btnResetFilter');
const btnExportCsv = document.getElementById('btnExportCsv');
const latenessTable = document.getElementById('latenessTable');
const pieCtx = document.getElementById('pieChart').getContext('2d');
const barCtx = document.getElementById('barChart').getContext('2d');
let pieChart = null, barChart = null;

// Toast helper
function toast(msg, timeout = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), timeout);
}

// Simpan ke localStorage
function saveStudents() {
  localStorage.setItem(KEY_STUDENTS, JSON.stringify(students));
}
function saveLateness() {
  localStorage.setItem(KEY_LATE, JSON.stringify(lateness));
}

// Set waktu otomatis
function setNow() {
  const now = new Date();
  tanggalInput.value = now.toISOString().slice(0, 10);
  jamInput.value = now.toTimeString().slice(0, 5);
}
setNow();
setInterval(setNow, 30 * 1000);

// ==================== ONLINE SYNC SECTION ====================

// 🔹 Ambil daftar siswa dari Google Sheet
async function loadStudentsFromSheet() {
  try {
    toast("📡 Memuat data siswa dari Google Sheets...");
    const res = await fetch(`${SHEET_API_URL}?type=siswa`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      students = data.map((s, i) => ({
        id: i + 1,
        name: s.nama,
        klass: s.kelas
      }));
      saveStudents();
      updateClassOptions();
      renderClassSummary();
      renderClassList('');
      populateStudentsForInput('');
      toast(`✅ ${students.length} data siswa dimuat dari Google Sheets`);
    } else {
      toast('⚠️ Tidak ada data siswa di Google Sheets');
    }
  } catch (err) {
    console.error('❌ Gagal ambil data siswa:', err);
    toast('Gagal memuat data siswa online');
  }
}

// 🔹 Kirim data siswa baru ke Google Sheet
async function sendStudentToSheet(nama, kelas) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'siswa', nama, kelas }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Gagal kirim siswa ke sheet:', err);
  }
}

// 🔹 Kirim data keterlambatan ke Google Sheet
async function sendLatenessToSheet(rec) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'keterlambatan',
        kelas: rec.klass,
        nama: rec.name,
        jam: rec.time,
        alasan: rec.reason
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Gagal kirim keterlambatan ke sheet:', err);
  }
}

// ==================== APLIKASI UTAMA ====================

// Parse teks daftar siswa
function parseLines(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = [];
  lines.forEach((line, idx) => {
    const parts = line.split(/\t| {2,}|\s+/).filter(Boolean);
    if (parts.length < 2) throw new Error(`Format salah di baris ${idx + 1}`);
    const klass = parts.pop();
    const name = parts.join(' ');
    out.push({ id: Date.now() + Math.random(), name, klass });
  });
  return out;
}

// Update UI
function updateClassOptions() {
  const classes = Array.from(new Set(students.map(s => s.klass))).sort();
  function fill(sel, includeAll = true) {
    sel.innerHTML = includeAll
      ? '<option value="">-- Semua Kelas --</option>'
      : '<option value="">-- Pilih Kelas --</option>';
    classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
  }
  fill(selectClassForInput, false);
  fill(filterKelas, true);
}

function renderClassSummary() {
  const counts = {};
  students.forEach(s => (counts[s.klass] = (counts[s.klass] || 0) + 1));
  if (!Object.keys(counts).length) {
    classSummary.innerHTML = '<div class="muted">Belum ada data siswa.</div>';
    return;
  }
  classSummary.innerHTML = Object.entries(counts)
    .map(([k, n]) => `<div><strong>${k}</strong>: ${n} siswa</div>`)
    .join('');
}

function renderClassList(klass = '') {
  const list = klass ? students.filter(s => s.klass === klass) : students;
  if (!list.length) {
    classList.innerHTML = '<div class="muted">Tidak ada siswa.</div>';
    return;
  }
  classList.innerHTML =
    '<table class="table"><thead><tr><th>Nama</th><th>Kelas</th></tr></thead><tbody>' +
    list
      .map(
        s =>
          `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(
            s.klass
          )}</td></tr>`
      )
      .join('') +
    '</tbody></table>';
}

function populateStudentsForInput(klass = '') {
  studentSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  const list = klass ? students.filter(s => s.klass === klass) : students;
  list.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' (' + s.klass + ')';
    studentSelect.appendChild(opt);
  });
}

// Import siswa
btnProcessPaste.addEventListener('click', async () => {
  try {
    const parsed = parseLines(pasteBox.value || '');
    for (const p of parsed) {
      if (!students.find(s => s.name === p.name && s.klass === p.klass)) {
        students.push(p);
        await sendStudentToSheet(p.name, p.klass);
      }
    }
    saveStudents();
    updateClassOptions();
    renderClassSummary();
    populateStudentsForInput('');
    renderClassList('');
    toast('✅ Data siswa disimpan (lokal + online)');
    pasteBox.value = '';
  } catch (e) {
    toast(e.message);
  }
});

// Hapus semua siswa lokal
btnClearStudents.addEventListener('click', () => {
  if (confirm('Hapus semua siswa dari perangkat ini?')) {
    students = [];
    saveStudents();
    updateClassOptions();
    renderClassSummary();
    renderClassList('');
    populateStudentsForInput('');
    toast('🗑️ Semua siswa dihapus (hanya lokal)');
  }
});

// Simpan keterlambatan
saveLatenessBtn.addEventListener('click', async () => {
  const sid = studentSelect.value;
  if (!sid) return toast('Pilih dulu siswa');
  const s = students.find(x => String(x.id) === String(sid));
  if (!s) return toast('Siswa tidak ditemukan');
  const now = new Date();
  const rec = {
    id: Date.now() + Math.random(),
    name: s.name,
    klass: s.klass,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    reason: alasanInput.value || ''
  };
  lateness.unshift(rec);
  saveLateness();
  alasanInput.value = '';
  renderLatenessTable();
  updateCharts();
  toast('✅ Data tersimpan (lokal + online)');
  await sendLatenessToSheet(rec);
});

// ====== Fungsi lain (filter, export, PDF, chart, utilitas) tetap sama ======
function renderLatenessTable(list = null) {
  const data = list || lateness;
  if (!data.length) {
    latenessTable.innerHTML =
      '<div class="muted">Belum ada catatan keterlambatan.</div>';
    return;
  }
  const rows = data
    .map(
      r =>
        `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(
          r.klass
        )}</td><td>${r.date}</td><td>${r.time}</td><td>${escapeHtml(
          r.reason || ''
        )}</td></tr>`
    )
    .join('');
  latenessTable.innerHTML = `<table class="table"><thead><tr><th>Nama</th><th>Kelas</th><th>Tanggal</th><th>Jam</th><th>Alasan</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function randColor() {
  const r = Math.floor(Math.random() * 200) + 30;
  const g = Math.floor(Math.random() * 200) + 30;
  const b = Math.floor(Math.random() * 200) + 30;
  return `rgba(${r},${g},${b},0.85)`;
}
function escapeHtml(t) {
  return String(t || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function toCSV(rows) {
  return rows
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

// Inisialisasi
async function initial() {
  document.getElementById('year').textContent = new Date().getFullYear();
  updateClassOptions();
  renderClassSummary();
  populateStudentsForInput('');
  renderLatenessTable();
  await loadStudentsFromSheet();
}
initial();







