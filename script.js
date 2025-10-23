// v7 — Combined final + Google Sheets Integration
// LocalStorage keys
const KEY_STUDENTS = 'lts_v7_students';
const KEY_LATE = 'lts_v7_late';
// State
let students = JSON.parse(localStorage.getItem(KEY_STUDENTS) || '[]');
let lateness = JSON.parse(localStorage.getItem(KEY_LATE) || '[]');

// Elements
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

// URL Google Apps Script kamu:
const SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzd3rGRZWFuLA-v3OhESfQkmmBRcTw2h_VI-G6JIpGH-f8m2PIc0qyhmZQxbOiGCs0F/exec';

// Toast helper
function toast(msg, timeout=2500){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), timeout); }

// Save/load
function saveStudents(){ localStorage.setItem(KEY_STUDENTS, JSON.stringify(students)); }
function saveLateness(){ localStorage.setItem(KEY_LATE, JSON.stringify(lateness)); }
function setNow(){ const now=new Date(); tanggalInput.value = now.toISOString().slice(0,10); jamInput.value = now.toTimeString().slice(0,5); }
setNow(); setInterval(setNow, 30*1000);

// Parse pasted lines
function parseLines(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const out = [];
  lines.forEach((line, idx)=>{
    const parts = line.split(/\t| {2,}|\s+/).filter(Boolean);
    if(parts.length < 2) throw new Error(`Format salah di baris ${idx+1}`);
    const klass = parts.pop();
    const name = parts.join(' ');
    out.push({ id: Date.now()+Math.random(), name, klass });
  });
  return out;
}

// Update UI
function updateClassOptions(){
  const classes = Array.from(new Set(students.map(s=>s.klass))).sort();
  function fill(sel, includeAll=true){
    sel.innerHTML = includeAll ? '<option value="">-- Semua Kelas --</option>' : '<option value="">-- Pilih Kelas --</option>';
    classes.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.textContent=c; sel.appendChild(opt); });
  }
  fill(selectClassForInput, false);
  fill(filterKelas, true);
}

function renderClassSummary(){
  const counts = {};
  students.forEach(s=> counts[s.klass] = (counts[s.klass]||0)+1);
  if(!Object.keys(counts).length){ classSummary.innerHTML = '<div class="muted">Belum ada data siswa.</div>'; return; }
  classSummary.innerHTML = Object.entries(counts).map(([k,n])=>`<div><strong>${k}</strong>: ${n} siswa</div>`).join('');
}

function renderClassList(klass=''){
  const list = klass ? students.filter(s=>s.klass===klass) : students;
  if(!list.length){ classList.innerHTML = '<div class="muted">Tidak ada siswa.</div>'; return; }
  classList.innerHTML = '<table class="table"><thead><tr><th>Nama</th><th>Kelas</th></tr></thead><tbody>' + list.map(s=>`<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.klass)}</td></tr>`).join('') + '</tbody></table>';
}

function populateStudentsForInput(klass=''){
  studentSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  const list = klass ? students.filter(s=>s.klass===klass) : students;
  list.forEach(s=>{ const opt=document.createElement('option'); opt.value = s.id; opt.textContent = s.name + ' ('+s.klass+')'; studentSelect.appendChild(opt); });
}

// Events
document.getElementById('btnProcessPaste').addEventListener('click', ()=>{
  try{
    const parsed = parseLines(document.getElementById('pasteBox').value || '');
    parsed.forEach(p=>{ if(!students.find(s=>s.name===p.name && s.klass===p.klass)) students.push(p); });
    saveStudents(); updateClassOptions(); renderClassSummary(); populateStudentsForInput(''); toast('✅ Import selesai');
    document.getElementById('pasteBox').value = '';
  }catch(e){ toast(e.message); }
});

document.getElementById('btnClearStudents').addEventListener('click', ()=>{ 
  if(confirm('Hapus semua siswa?')){ 
    students=[]; saveStudents(); updateClassOptions(); renderClassSummary(); renderClassList(''); populateStudentsForInput(''); 
    toast('🗑️ Semua siswa dihapus'); 
  } 
});

// Kelas berubah
selectClassForInput.addEventListener('change', ()=> populateStudentsForInput(selectClassForInput.value) );

// ✅ Simpan data keterlambatan (lokal + kirim ke Google Sheets)
document.getElementById('saveLateness').addEventListener('click', ()=>{
  const sid = studentSelect.value;
  if(!sid) return toast('Pilih dulu siswa (pilih kelas lalu siswa)');
  const s = students.find(x=>String(x.id)===String(sid));
  if(!s) return toast('Siswa tidak ditemukan');

  const now = new Date();
  const rec = { 
    id: Date.now()+Math.random(), 
    name: s.name, 
    klass: s.klass, 
    date: now.toISOString().slice(0,10), 
    time: now.toTimeString().slice(0,5), 
    reason: alasanInput.value||'' 
  };

  lateness.unshift(rec);
  saveLateness();
  alasanInput.value = '';
  renderLatenessTable();
  updateCharts();
  toast('✅ Data tersimpan (lokal + online)');

  // Kirim ke Google Sheets
  fetch(SHEET_WEBAPP_URL, {
    method: 'POST',
    body: JSON.stringify({
      kelas: s.klass,
      nama: s.name,
      jam: rec.time,
      alasan: rec.reason
    }),
    headers: { 'Content-Type': 'application/json' }
  }).then(r => r.text())
    .then(t => console.log('Response Sheets:', t))
    .catch(err => console.error('Error kirim data ke Google Sheet:', err));
});

// ... (semua fungsi lainnya seperti renderLatenessTable, filters, export, PDF, charts, initial) ...
// (Biarkan bagian bawah tetap sama dengan file aslimu)
