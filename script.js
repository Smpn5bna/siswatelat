// === URL APPS SCRIPT ===
// Gunakan proxy CORS Anywhere agar bisa diakses dari GitHub Pages
const SHEET_URL = "https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbwDw5rQv3rBZ1GE6J9lkOK7_BR9m5sTRYfIUFXzGg7B31lkK--QH3qmWO-dfOZtJPm5/exec";

// Data penyimpanan sementara di browser
let lateness = [];

// Format tanggal (YYYY-MM-DD)
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Ambil data siswa dan keterlambatan dari Google Sheet
async function loadStudents() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();

    const students = data.siswa || [];
    const latenessData = data.keterlambatan || [];

    // Filter hanya data hari ini
    const today = getTodayDate();
    lateness = latenessData.filter(d => d.timestamp.startsWith(today));

    // Isi dropdown kelas
    const kelasSelect = document.getElementById("kelasSelect");
    const nameSelect = document.getElementById("namaSelect");

    const uniqueClasses = [...new Set(students.map(s => s.kelas))];
    kelasSelect.innerHTML = `<option value="">-- Pilih Kelas --</option>` +
      uniqueClasses.map(k => `<option value="${k}">${k}</option>`).join("");

    // Update dropdown nama berdasarkan kelas
    kelasSelect.addEventListener("change", () => {
      const selectedClass = kelasSelect.value;
      const filteredStudents = students.filter(s => s.kelas === selectedClass);
      nameSelect.innerHTML = `<option value="">-- Pilih Siswa --</option>` +
        filteredStudents.map(s => `<option value="${s.nama}">${s.nama}</option>`).join("");
    });

    renderTable();
    console.log("✅ Data siswa & keterlambatan berhasil dimuat.");
  } catch (error) {
    console.error("❌ Gagal memuat data:", error);
    alert("Gagal memuat data siswa, periksa koneksi atau izin akses Apps Script.");
  }
}

// Simpan keterlambatan
async function sendLateness() {
  const kelas = document.getElementById("kelasSelect").value;
  const nama = document.getElementById("namaSelect").value;
  const alasan = document.getElementById("alasan").value;

  if (!kelas || !nama || !alasan) {
    alert("Semua kolom harus diisi!");
    return;
  }

  const now = new Date();
  const jam = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  const body = new FormData();
  body.append("kelas", kelas);
  body.append("nama", nama);
  body.append("jam", jam);
  body.append("alasan", alasan);

  try {
    const res = await fetch(SHEET_URL, { method: "POST", body });
    const result = await res.text();
    console.log("✅ Data tersimpan:", result);
    alert("Data keterlambatan berhasil disimpan!");
    loadStudents();
  } catch (error) {
    console.error("❌ Gagal mengirim data:", error);
    alert("Gagal mengirim data. Coba lagi.");
  }
}

// Tampilkan tabel keterlambatan
function renderTable() {
  const tbody = document.getElementById("latenessTable");
  if (!lateness.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data hari ini</td></tr>`;
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

// Jalankan saat web dibuka
document.addEventListener("DOMContentLoaded", () => {
  console.log("📱 Aplikasi keterlambatan aktif");
  loadStudents();
  document.getElementById("simpanBtn").addEventListener("click", sendLateness);
});
