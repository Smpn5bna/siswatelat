// === KONFIGURASI ===
// Ganti URL ini dengan URL Web App milikmu dari Google Apps Script (yang /exec)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzNUkWcbmS0ZLegTfhqonDWYaN0ExP3-zPzUCjhHuxZEBX9mFHhx0RTV7lVMHYTT2qa/exec";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Aplikasi keterlambatan aktif");
  await loadStudents();
  await loadKeterlambatanHariIni();

  document.getElementById("btnSimpan").addEventListener("click", simpanData);
});

// === Fungsi ambil data siswa dari Google Sheet ===
async function loadStudents() {
  try {
    const res = await fetch(`${SHEET_URL}?type=siswa`);
    if (!res.ok) throw new Error("Gagal ambil data siswa");
    const data = await res.json();

    console.log("Data siswa berhasil dimuat:", data);
    isiDropdownKelas(data.siswa);
  } catch (err) {
    console.error("Gagal memuat data:", err);
    alert("Gagal memuat data siswa, periksa koneksi atau izin akses Apps Script.");
  }
}

// === Fungsi isi dropdown kelas & siswa ===
function isiDropdownKelas(dataSiswa) {
  const kelasSet = [...new Set(dataSiswa.map(s => s.kelas))].sort();
  const selectKelas = document.getElementById("kelas");
  const selectSiswa = document.getElementById("nama");

  selectKelas.innerHTML = `<option value="">-- Pilih Kelas --</option>`;
  kelasSet.forEach(k => {
    selectKelas.innerHTML += `<option value="${k}">${k}</option>`;
  });

  selectKelas.addEventListener("change", () => {
    const kelasDipilih = selectKelas.value;
    const siswaFiltered = dataSiswa.filter(s => s.kelas === kelasDipilih);

    selectSiswa.innerHTML = `<option value="">-- Pilih Siswa --</option>`;
    siswaFiltered.forEach(s => {
      selectSiswa.innerHTML += `<option value="${s.nama}">${s.nama}</option>`;
    });
  });
}

// === Fungsi simpan data keterlambatan ===
async function simpanData() {
  const kelas = document.getElementById("kelas").value;
  const nama = document.getElementById("nama").value;
  const alasan = document.getElementById("alasan").value.trim();

  if (!kelas || !nama || !alasan) {
    alert("Harap isi semua kolom!");
    return;
  }

  const data = { kelas, nama, alasan };

  try {
    const res = await fetch(SHEET_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.success) {
      alert("✅ Data keterlambatan berhasil disimpan!");
      await loadKeterlambatanHariIni();
    } else {
      alert("❌ Gagal menyimpan data: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan koneksi ke server.");
  }
}

// === Fungsi ambil data keterlambatan hari ini ===
async function loadKeterlambatanHariIni() {
  try {
    const res = await fetch(`${SHEET_URL}?type=keterlambatan`);
    if (!res.ok) throw new Error("Gagal ambil data keterlambatan");
    const data = await res.json();

    const tbody = document.querySelector("#tabelData tbody");
    tbody.innerHTML = "";

    const today = new Date().toISOString().slice(0, 10);
    const hariIni = data.keterlambatan.filter(d =>
      d.timestamp.includes(today)
    );

    if (hariIni.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center">Belum ada data hari ini</td></tr>`;
      return;
    }

    hariIni.forEach((d, i) => {
      const row = `<tr>
        <td>${i + 1}</td>
        <td>${d.nama}</td>
        <td>${d.kelas}</td>
        <td>${d.jam}</td>
        <td>${d.alasan}</td>
      </tr>`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error("Gagal memuat data keterlambatan:", err);
  }
}
