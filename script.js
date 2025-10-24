// === SMP Negeri 5 Banda Aceh - Keterlambatan Online ===
// Versi fix: Integrasi Google Sheets + CORS support

const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzvd-13ErTBxngUo_zcTDTkFKwE4KVkz5VcysHc6ZkQ5PaJhwiqMMNlAUkPx-9LEKhW/exec';

// LocalStorage backup (offline mode)
const KEY_STUDENTS = 'lts_students';
const KEY_LATE = 'lts_late';

let students = JSON.parse(localStorage.getItem(KEY_STUDENTS) || '[]');
let lateness = JSON.parse(localStorage.getItem(KEY_LATE) || '[]');

// Simpan ke LocalStorage
function saveStudents() {
  localStorage.setItem(KEY_STUDENTS, JSON.stringify(students));
}
function saveLateness() {
  localStorage.setItem(KEY_LATE, JSON.stringify(lateness));
}

// === Load data siswa dari Google Sheet ===
async function loadStudentsFromSheet() {
  try {
    const res = await fetch(SHEET_API_URL + '?type=siswa');
    const data = await res.json();
    if (!data || !data.length) throw new Error('Data siswa kosong');
    students = data;
    saveStudents();
    renderStudentSummary();
    console.log('✅ Data siswa dimuat dari Sheet');
  } catch (err) {
    console.error('❌ Gagal muat siswa:', err);
    toast('⚠️ Gagal memuat data siswa online, pakai data lokal.');
    renderStudentSummary();
  }
}

// === Kirim data keterlambatan ke Google Sheet ===
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
    console.log('✅ Data keterlambatan terkirim ke Google Sheet');
  } catch (err) {
    console.error('❌ Gagal kirim keterlambatan:', err);
  }
}

// === Render daftar siswa per kelas ===
function renderStudentSummary() {
  const summaryBox = document.getElementById('studentSummary');
  if (!summaryBox) return;
  const grouped = {};
  students.forEach(s => {
    if (!grouped[s.kelas]) grouped[s.kelas] = 0;
    grouped[s.kelas]++;
  });
  summaryBox.innerHTML = Object.entries(grouped)
    .map(([kelas, jumlah]) => `<div><b>${kelas}</b>: ${jumlah} siswa</div>`)
    .join('');
}

// === Tambah data keterlambatan ===
async function addLateness(kelas, nama, alasan) {
  const now = new Date();
  const rec = {
    klass: kelas,
    name: nama,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    reason: alasan || ''
  };
  lateness.unshift(rec);
  saveLateness();
  renderLatenessTable();
  await sendLatenessToSheet(rec);
  toast('✅ Data tersimpan (lokal + online)');
}

// === Render tabel keterlambatan ===
function renderLatenessTable() {
  const tbody = document.getElementById('latenessTable');
  if (!tbody) return;
  if (!lateness.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data</td></tr>`;
    return;
  }
  tbody.innerHTML = lateness
    .map(
      r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.klass}</td>
      <td>${r.date} ${r.time}</td>
      <td>${r.reason || '-'}</td>
    </tr>`
    )
    .join('');
}

// === Toast notification ===
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 4000);
}

// === Saat halaman dibuka ===
document.addEventListener('DOMContentLoaded', () => {
  renderLatenessTable();
  renderStudentSummary();
  loadStudentsFromSheet();
  console.log('✅ SISWATELAT aktif');
});







