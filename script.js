// URL Web App Google Apps Script kamu
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwZf6EgGnKNUQeax6nCwV9PVAmm4NvoBfpn1mXTKFU2BUWPZut0NqNl8EmSJcAsq34X/exec";

let lateness = [];
let students = [];

// ====================== FUNGSI UTAMA ======================

// Ambil daftar siswa dari Sheet
async function loadStudents() {
  try {
    const res = await fetch(`${SHEET_API_URL}?type=siswa`);
    students = await res.json();

    // Isi dropdown kelas
    const kelasSet = [...new Set(students.map(s => s.kelas))].sort();
    const kelasSelect = document.getElementById("kelas");
    kelasSelect.innerHTML = `<option value="">-- Pilih Kelas --</option>` +
      kelasSet.map(k => `<option value="${k}">${k}</option>`).join("");

    // Event ketika kelas dipilih
    kelasSelect.addEventListener("change", () => {
      const selected = kelasSelect.value;
      const siswaSelect = document.getElementById("nama");
      const filtered = students.filter(s => s.kelas === selected);

      siswaSelect.innerHTML = `<option value="">-- Pilih Siswa --</option>` +
        filtered.map(s => `<option value="${s.nama}">${s.nama}</option>`).join("");
    });
  } catch (err) {
    console.error("Gagal memuat data siswa:", err);
    showToast("⚠️ Gagal memuat data siswa online, pakai data lokal.");
  }
}

// Ambil data keterlambatan dari Sheet
async function loadLatenessFromSheet() {
  try {
    const res = await fetch(`${SHEET_API_URL}?type=keterlambatan`);
    const data = await res.json();

    if (Array.isArray(data)) {
      lateness = data;
      renderTable();
    }
  } catch (err) {
    console.error("Gagal memuat data keterlambatan:", err);
  }
}

// Kirim data keterlambatan baru ke Sheet
async function sendLateness() {
  const kelas = document.getElementById("kelas").value;
  const nama = document.getElementById("nama").value;
  const alasan = document.getElementById("alasan").value.trim();
  const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (!kelas || !nama) {
    showToast("⚠️ Pilih kelas dan nama siswa!");
    return;
  }

  const record = { kelas, nama, jam, alasan };

  try {
    await fetch(SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "keterlambatan", ...record }),
    });

    // Tambahkan ke tampilan langsung
    lateness.unshift(record);
    renderTable();
    showToast("✅ Data keterlambatan tersimpan!");
  } catch (err) {
    console.error("Gagal kirim data:", err);
    showToast("❌ Gagal menyimpan ke Sheet!");
  }
}

// ====================== RENDER TABEL ======================
function renderTable() {
  const tbody = document.querySelector("#latenessTable tbody");
  if (!tbody) return;

  if (lateness.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = lateness
    .map(r => `
      <tr>
        <td>${r.nama}</td>
        <td>${r.kelas}</td>
        <td>${r.jam}</td>
        <td>${r.alasan || "-"}</td>
      </tr>
    `)
    .join("");
}

// ====================== NOTIFIKASI (TOAST) ======================
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 4000);
}

// ====================== SAAT HALAMAN DIBUKA ======================
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();            // ambil data siswa dari Sheet
  loadLatenessFromSheet();   // ambil data keterlambatan dari Sheet
  document.getElementById("simpanBtn").addEventListener("click", sendLateness);
  console.log("✅ Aplikasi keterlambatan aktif");
});
