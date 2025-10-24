const SHEET_URL = "https://script.google.com/macros/s/AKfycbzVT51U2GBA_0_oqZ9EaLY8nJ3WGtU33KwDYpmE9m3Df5b2vA7fbZkoUlsZCEut-UU/exec";

// Data sementara di browser
let lateness = [];
let students = [];

// Format tanggal (YYYY-MM-DD)
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// 🔹 Ambil data siswa & keterlambatan dari Google Sheet
async function loadStudents() {
  try {
    // Ambil data siswa
    const resSiswa = await fetch(`${SHEET_URL}?type=siswa`);
    const dataSiswa = await resSiswa.json();
    students = dataSiswa.siswa || [];

    // Ambil data keterlambatan
    const resKeterlambatan = await fetch(`${SHEET_URL}?type=riwayat`);
    const dataKeterlambatan = await resKeterlambatan.json();
    lateness = dataKeterlambatan.keterlambatan || [];

    renderClassOptions();
    renderTable();

    console.log("✅ Data siswa & keterlambatan berhasil dimuat.");
  } catch (err) {
    console.error("❌ Gagal memuat data:", err);
    alert("Gagal memuat data siswa, periksa koneksi atau izin akses Apps Script.");
  }
}

// 🔹 Isi dropdown kelas dan siswa
function renderClassOptions() {
  const kelasSelect = document.getElementById("kelasSelect");
  const namaSelect = document.getElementById("namaSelect");

  if (!kelasSelect || !namaSelect) return;

  // Ambil daftar kelas unik
  const kelasList = [...new Set(students.map(s => s.kelas))];
  kelasSelect.innerHTML = `<option value="">-- Pilih Kelas --</option>` + 
    kelasList.map(k => `<option value="${k}">${k}</option>`).join("");

  kelasSelect.addEventListener("change", () => {
    const selectedKelas = kelasSelect.value;
    const siswaKelas = students.filter(s => s.kelas === selectedKelas);

    namaSelect.innerHTML = `<option value="">-- Pilih Siswa --</option>` + 
      siswaKelas.map(s => `<option value="${s.nama}">${s.nama}</option>`).join("");
  });
}

// 🔹 Kirim data keterlambatan ke Google Sheet
async function sendLateness() {
  const kelas = document.getElementById("kelasSelect").value;
  const nama = document.getElementById("namaSelect").value;
  const alasan = document.getElementById("alasan").value.trim();

  if (!kelas || !nama) {
    alert("Pilih kelas dan nama siswa terlebih dahulu!");
    return;
  }

  try {
    const res = await fetch(`${SHEET_URL}?type=keterlambatan&kelas=${encodeURIComponent(kelas)}&nama=${encodeURIComponent(nama)}&alasan=${encodeURIComponent(alasan)}`);
    const data = await res.json();

    if (data.status === "success") {
      alert("✅ Data keterlambatan berhasil disimpan!");
      loadStudents(); // Refresh data setelah simpan
    } else {
      alert("❌ Gagal menyimpan data: " + data.message);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Terjadi kesalahan saat menyimpan data.");
  }
}

// 🔹 Render tabel riwayat keterlambatan hari ini
function renderTable() {
  const tbody = document.getElementById("latenessTable");
  if (!tbody) return;

  const today = getTodayDate();
  const todayData = lateness.filter(d => String(d.jam).length > 0);

  if (todayData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data hari ini</td></tr>`;
    return;
  }

  tbody.innerHTML = todayData.map(r => `
    <tr>
      <td>${r.nama}</td>
      <td>${r.kelas}</td>
      <td>${r.jam}</td>
      <td>${r.alasan || "-"}</td>
    </tr>
  `).join("");
}

// 🔹 Jalankan saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  document.getElementById("simpanBtn").addEventListener("click", sendLateness);
  console.log("🚀 Aplikasi keterlambatan aktif");
});



