// === SMP Negeri 5 Banda Aceh — Keterlambatan Siswa v11 ===
// Integrasi penuh Google Sheets + cadangan offline

const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwZUJk2sRag2cO6z8ayYqOGt-co--VWz0oWskTzsMaHCRLgSkxtjPdLc-MxnxG4AlZA/exec';
// Backup offline
const KEY_STUDENTS = 'lts_v11_students';
const KEY_LATE = 'lts_v11_late';

let students = JSON.parse(localStorage.getItem(KEY_STUDENTS) || '[]');
let lateness = JSON.parse(localStorage.getItem(KEY_LATE) || '[]');

// Simpan lokal
function saveLocal() {
  localStorage.setItem(KEY_STUDENTS, JSON.stringify(students));
  localStorage.setItem(KEY_LATE, JSON.stringify(lateness));
}

function toast(msg) {
  console.log(msg);
  const box = document.getElementById("toast");
  if (box) {
    box.innerText = msg;
    box.classList.remove("hidden");
    setTimeout(() => box.classList.add("hidden"), 3000);
  } else {
    alert(msg);
  }
}

// Ambil data siswa dari Sheet
async function loadStudentsFromSheet() {
  try {
    const res = await fetch(SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "siswa" })
    });

    students = await res.json();
    saveLocal();
    toast(`✅ ${students.length} data siswa dimuat dari Sheet`);
  } catch (err) {
    console.error("Gagal muat siswa:", err);
    toast("⚠️ Gagal memuat data siswa online, pakai data lokal.");
  }
}

// Kirim keterlambatan ke Sheet
async function sendLatenessToSheet(rec) {
  try {
    const payload = {
      type: "keterlambatan",
      kelas: rec.kelas,
      nama: rec.nama,
      jam: rec.jam,
      alasan: rec.alasan
    };

    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Terkirim ke sheet:", payload);
    toast("✅ Data terkirim ke Google Sheet");
  } catch (err) {
    console.error("Gagal kirim:", err);
    toast("⚠️ Gagal kirim ke Google Sheet");
  }
}

// Simpan data dari form
function simpanData() {
  const nama = document.getElementById("nama").value.trim();
  const kelas = document.getElementById("kelas").value.trim();
  const alasan = document.getElementById("alasan").value.trim();
  const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (!nama || !kelas) return toast("⚠️ Nama dan Kelas wajib diisi");

  const rec = { nama, kelas, jam, alasan };
  lateness.unshift(rec);
  saveLocal();
  renderTable();
  sendLatenessToSheet(rec);
}

// Render tabel
function renderTable() {
  const tbody = document.getElementById("latenessTable");
  if (!tbody) return;

  if (!lateness.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = lateness.map(r => `
    <tr>
      <td>${r.nama}</td>
      <td>${r.kelas}</td>
      <td>${r.jam}</td>
      <td>${r.alasan || "-"}</td>
    </tr>
  `).join("");
}

// Saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  loadStudentsFromSheet();
  console.log("✅ SISWATELAT v11 aktif");
});
