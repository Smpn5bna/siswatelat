// === SMP Negeri 5 Banda Aceh — Keterlambatan Online ===
// v8 — Integrasi Google Sheets + fitur lama
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzEhcBcSRtPQpXbMy_DEQCCUpdHe4KG_8-J-10W-H6dqu__xgtqchULAXqCoil5KMkI/exec';

// LocalStorage backup (cadangan offline)
const KEY_STUDENTS = 'lts_v8_students';
const KEY_LATE = 'lts_v8_late';

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

// ===============
