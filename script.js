<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keterlambatan Siswa SMPN 5 Banda Aceh</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h2>Keterlambatan Siswa SMPN 5 Banda Aceh</h2>

    <div class="form-container">
      <label for="kelas">Kelas</label>
      <select id="kelas">
        <option value="">-- Pilih Kelas --</option>
      </select>

      <label for="nama">Nama Siswa</label>
      <select id="nama">
        <option value="">-- Pilih Siswa --</option>
      </select>

      <label for="alasan">Alasan</label>
      <input type="text" id="alasan" placeholder="Tulis alasan keterlambatan...">

      <button id="btnSimpan">Simpan</button>
    </div>

    <h3>Daftar Keterlambatan Hari Ini</h3>
    <table>
      <thead>
        <tr>
          <th>Nama</th>
          <th>Kelas</th>
          <th>Jam</th>
          <th>Alasan</th>
        </tr>
      </thead>
      <tbody id="tabelData">
        <tr><td colspan="4">Belum ada data hari ini</td></tr>
      </tbody>
    </table>
  </div>

  <script src="script.js"></script>
</body>
</html>
