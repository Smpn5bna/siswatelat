// === SMPN 5 Banda Aceh ===
// Integrasi Website dengan Google Sheet

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwZf6EgGnKNUQeax6nCwV9PVAmm4NvoBfpn1mXTKFU2BUWPZut0NqNl8EmSJcAsq34X/exec";

let students = [];
let lateness = [];

// 🔹 Ambil daftar siswa dari sheet “Siswa”
async function loadStudents() {
  try {
    const res = await fetch(`${SHEET_API_URL}?type=siswa`);
    const data = await res.json();
    if (!data.length) throw new Error("Data kosong");
    students = data;
    populateSelects();
    showToast("✅ Data siswa dimuat dari Google Sheet");
  } catch (err) {
    console.error("Gagal muat siswa:", err);
    showToast("⚠️ Tidak bisa ambil data online, cek Apps Script");
  }
}

// 🔹 Isi dropdown kelas dan siswa
function populateSelects() {
  const kelasSelect = document.getElementById("kelasSelect");
  const namaSelect = document.getElementById("namaSelect");

  const kelasList = [...new Set(students.map(s => s.kelas))].sort();
  kelasSelect.innerHTML = `<option value="">-- Pilih Kelas --</option>` + kelasList.map(k => `<option>${k}</option>`).join("");

  kelasSelect.addEventListener("change", () => {
    const sel = kelasSelect.value;
    const filtered = students.filter(s => s.kelas === sel);
    namaSelect.innerHTML = `<option value="">-- Pilih Siswa --</option>` + filtered.map(s => `<option>${s.nama}</option>`).join("");
  });
}

// 🔹 Simpan keterlambatan ke Sheet
async function sendLateness() {
  const kelas = document.getElementById("kelasSelect").value;
  const nama = document.getElementById("namaSelect").value;
  const alasan = document.getElementById("alasan").value;
  if (!kelas || !nama) return showToast("⚠️ Pilih kelas dan nama dulu.");

  const now = new Date();
  const jam = now.toTimeString().slice(0,5);
  const rec = { kelas, nama, jam, alasan };

  lateness.unshift(rec);
  renderTable();

  try {
    await fetch(SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "keterlambatan", ...rec })
    });
    showToast("✅ Data tersimpan di Google Sheet");
  } catch (err) {
    console.error(err);
    showToast("⚠️ Gagal kirim ke Google Sheet");
  }
}

// 🔹 Render tabel
function renderTable() {
  const tbody = document.getElementById("latenessTable");
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

// 🔹 Notifikasi (toast)
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 4000);
}

// Jalankan saat web dibuka
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  document.getElementById("simpanBtn").addEventListener("click", sendLateness);
});

