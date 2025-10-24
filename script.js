const SHEET_URL = "https://script.google.com/macros/s/AKfycbwZf6EgGnKNUQeax6nCwV9PVAmm4NvoBfpn1mXTKFU2BUWPZut0NqNl8EmSJcAsq34X/exec";

// Data penyimpanan sementara di browser
let lateness = [];

// Format tanggal (YYYY-MM-DD)
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// 🔹 Ambil data siswa dan keterlambatan dari Google Sheet
async function loadStudents() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();

    // Pisahkan data siswa dan keterlambatan
    const students = data.siswa || [];
    const latenessData = data.keterlambatan || [];

    // Filter hanya data hari ini
    const today = getTodayDate();
    lateness = latenessData.filter(d => d.timestamp.startsWith(today));

    // Isi dropdown kelas
    const kelasSelect = document.getElementById("kelas");
    const namaSelect = document.getElementById("nama");

    // Ambil kelas unik
    const kelasList = [...new Set(students.map(s => s.kelas))].sort();
    kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' +
      kelasList.map(k => `<option value="${k}">${k}</option>`).join("");

    // Update nama saat kelas berubah
    kelasSelect.addEventListener("change", () => {
      const selectedKelas = kelasSelect.value;
      const filtered = students.filter(s => s.kelas === selectedKelas);
      namaSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
        filtered.map(s => `<option value="${s.nama}">${s.nama}</option>`).join("");
    });

    renderTable();
    console.log("✅ Data siswa & keterlambatan berhasil dimuat.");
  } catch (err) {
    console.error("❌ Gagal memuat data:", err);
    showToast("⚠️ Gagal memuat data online, gunakan data lokal.");
  }
}

// 🔹 Kirim data keterlambatan baru ke Google Sheet
async function sendLateness() {
  const kelas = document.getElementById("kelas").value;
  const nama = document.getElementById("nama").value;
  const alasan = document.getElementById("alasan").value.trim();
  const jam = new Date().toTimeString().slice(0, 5);

  if (!kelas || !nama || !alasan) {
    showToast("⚠️ Lengkapi semua data terlebih dahulu!");
    return;
  }

  const record = { kelas, nama, alasan, jam };

  try {
    await fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify(record),
      headers: { "Content-Type": "application/json" }
    });

    // Tambah ke tampilan tanpa reload
    lateness.push({
      nama,
      kelas,
      jam,
      alasan,
      timestamp: getTodayDate()
    });
    renderTable();
    showToast("✅ Data berhasil disimpan!");
  } catch (err) {
    console.error("❌ Gagal kirim data:", err);
    showToast("❌ Gagal menyimpan data ke Sheet!");
  }
}

// 🔹 Render tabel data keterlambatan hari ini
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
      <td>${r.alasan}</td>
    </tr>
  `).join("");
}

// 🔹 Tampilkan pesan notifikasi
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 4000);
}

// Jalankan saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  document.getElementById("simpanBtn").addEventListener("click", sendLateness);
  console.log("🟢 Aplikasi keterlambatan aktif");
});
