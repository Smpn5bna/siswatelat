// Ganti dengan URL Web App milikmu (akhiran /exec)
const SHEET_URL = "https://https://script.google.com/macros/s/AKfycbzNUkWcbmS0ZLegTfhqonDWYaN0ExP3-zPzUCjhHuxZEBX9mFHhx0RTV7lVMHYTT2qa/exec";

// Variabel global
let dataSiswa = [];
let dataKeterlambatan = [];

// 🔹 Format tanggal (YYYY-MM-DD)
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// 🔹 Ambil data siswa & keterlambatan dari Apps Script
async function loadData() {
  try {
    const resSiswa = await fetch(`${SHEET_URL}?type=siswa`);
    const jsonSiswa = await resSiswa.json();
    dataSiswa = jsonSiswa.siswa || [];

    const resTelat = await fetch(`${SHEET_URL}?type=keterlambatan`);
    const jsonTelat = await resTelat.json();
    dataKeterlambatan = jsonTelat.keterlambatan || [];

    console.log("Data siswa & keterlambatan berhasil dimuat.");

    isiDropdownKelas();
    tampilkanKeterlambatanHariIni();
  } catch (err) {
    console.error("Gagal memuat data:", err);
    alert("Gagal memuat data siswa, periksa koneksi atau izin akses Apps Script.");
  }
}

// 🔹 Isi dropdown kelas dari data siswa
function isiDropdownKelas() {
  const selectKelas = document.getElementById("kelas");
  const kelasUnik = [...new Set(dataSiswa.map(s => s.kelas))].sort();

  kelasUnik.forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    selectKelas.appendChild(opt);
  });

  selectKelas.addEventListener("change", isiDropdownNama);
}

// 🔹 Isi dropdown nama sesuai kelas terpilih
function isiDropdownNama() {
  const kelas = document.getElementById("kelas").value;
  const selectNama = document.getElementById("nama");

  selectNama.innerHTML = `<option value="">-- Pilih Siswa --</option>`;

  const siswaKelas = dataSiswa.filter(s => s.kelas === kelas);
  siswaKelas.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.nama;
    opt.textContent = s.nama;
    selectNama.appendChild(opt);
  });
}

// 🔹 Simpan data keterlambatan ke Apps Script
async function simpanData() {
  const kelas = document.getElementById("kelas").value;
  const nama = document.getElementById("nama").value;
  const alasan = document.getElementById("alasan").value.trim();

  if (!kelas || !nama || !alasan) {
    alert("Mohon isi semua kolom sebelum menyimpan.");
    return;
  }

  const payload = { kelas, nama, alasan };

  try {
    const res = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (json.success) {
      alert("Data berhasil disimpan!");
      document.getElementById("alasan").value = "";
      await loadData();
    } else {
      alert("Gagal menyimpan data: " + json.message);
    }
  } catch (err) {
    console.error("Gagal menyimpan data:", err);
    alert("Gagal menyimpan data, periksa koneksi.");
  }
}

// 🔹 Tampilkan data keterlambatan hari ini
function tampilkanKeterlambatanHariIni() {
  const tbody = document.getElementById("tabelData");
  tbody.innerHTML = "";

  const today = getTodayDate();
  const dataHariIni = dataKeterlambatan.filter(d => d.timestamp && d.timestamp.startsWith(today));

  if (dataHariIni.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Belum ada data hari ini</td></tr>`;
    return;
  }

  dataHariIni.forEach(d => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.nama}</td>
      <td>${d.kelas}</td>
      <td>${d.jam}</td>
      <td>${d.alasan}</td>
    `;
    tbody.appendChild(row);
  });
}

// 🔹 Event listener tombol simpan
document.getElementById("btnSimpan").addEventListener("click", simpanData);

// 🔹 Jalankan saat halaman dimuat
window.addEventListener("load", loadData);
