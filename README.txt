KARANG TARUNA REMAJA DAMAI — Basecamp Pemuda
=============================================
Website statis (HTML + CSS + JavaScript murni, tanpa build). Buka index.html
lewat Live Server (VS Code) atau deploy ke Vercel/Netlify.

STRUKTUR
  index.html, kegiatan.html, kegiatan-detail.html, transparansi.html,
  dokumentasi.html ............ halaman publik
  login.html, daftar.html ..... masuk dan pendaftaran akun anggota
  dashboard, anggota, event, keuangan, iuran, inventaris, pinjaman,
  pinjaman-baru, achievement, arsip-rapat, dokumentasi-admin, laporan,
  jimpitan, absensi, notifikasi, pengaturan ...... panel pengurus
  css/style.css ............... semua gaya
  js/data.js ................... KONFIGURASI + skema tabel + lapisan database
  js/app.js .................... login & peran, form, tabel CRUD, kerangka halaman
  js/public.js, art.js ......... potongan tampilan publik & ikon
  js/<halaman>.js .............. logika tiap halaman
  img/hero-rumah.png ........... GANTI: gambar rumah/basecamp di beranda
  img/logo.png, logo.svg ....... logo huruf K (favicon & header); boleh diganti
  database.sql .................. tabel + aturan keamanan (RLS) untuk Supabase

GANTI GAMBAR
  Timpa img/hero-rumah.png dan img/logo.png dengan file milikmu (nama sama).
  Kalau pakai nama/format lain (mis. .jpg), ubah HERO_IMAGE / LOGO di js/data.js.

SAMBUNG DATABASE (Supabase)
  1. Buat project di supabase.com, buka SQL Editor, jalankan isi database.sql.
  2. Settings > API: salin Project URL dan anon public key.
  3. Isi API_URL dan API_KEY di bagian CONFIG pada js/data.js (API_URL TANPA
     "/rest/v1/" di belakang — kode sudah menambahkannya otomatis).
  Selama keduanya kosong, data disimpan di localStorage browser (hanya uji coba).

TIGA PERAN AKUN
  - Super Admin: akses PENUH ke semua data dan semua menu, termasuk mengatur
    peran akun lain, menyetujui pendaftar baru, dan membuka menu Jimpitan.
    Akun PERTAMA yang mendaftar otomatis jadi Super Admin.
  - Admin (biasa): hanya bisa menambah/mengubah/menghapus data di Inventaris
    dan Dokumentasi, serta membuka (melihat) Laporan. Menu lain di sidebar-nya
    tidak muncul sama sekali, dan kalaupun diakses lewat alamat langsung,
    otomatis dialihkan ke dashboard. Diangkat oleh Super Admin lewat menu
    Pengaturan (pilih peran "Admin" pada akun yang dituju).
  - Anggota: HANYA BISA MELIHAT. Tidak ada tombol Tambah/Ubah/Hapus di menu
    mana pun untuk anggota — semua data (kegiatan, keuangan, iuran, pinjaman,
    dokumentasi, dll) hanya diinput/diubah oleh Super Admin (atau Admin biasa
    khusus Inventaris & Dokumentasi). Anggota tetap bisa melihat kegiatan,
    kas, iuran & pinjaman miliknya sendiri, dokumentasi publik, dan mengganti
    password akunnya sendiri.
  Daftar sendiri lewat daftar.html; akun aktif setelah disetujui Super Admin
  di menu Pengaturan. Pengunjung tanpa akun hanya melihat halaman publik.
  Peran & tabel yang boleh ditulis diatur di js/app.js (WRITE_ADMIN_BIASA,
  OWN_ONLY) dan ditegakkan sungguhan lewat RLS di database.sql — dua tempat
  ini harus selalu sinkron.

ANGGOTA OTOMATIS + QR PRIBADI
  Setiap akun yang mendaftar otomatis menjadi satu baris di tabel Anggota
  (tidak perlu input manual), lengkap dengan kode QR pribadi 8 karakter.
  Anggota bisa melihat QR miliknya sendiri di Dashboard ("Kartu Anggota
  Saya") untuk ditunjukkan ke pengurus saat kumpul. Super Admin juga bisa
  melihat/mencetak QR siapa pun lewat menu Anggota → tombol "Lihat QR".

JIMPITAN (scan QR anggota + kas/tabungan)
  Menu khusus Super Admin. Alurnya:
  1. Buat dulu satu catatan di menu Arsip Rapat (judul & tanggal kumpul).
  2. Buka menu Jimpitan, pilih rapat itu sebagai "Rapat aktif" (tersimpan
     otomatis sampai diganti — jadi tidak perlu dipilih ulang tiap scan).
  3. Saat kumpul, scan QR pribadi tiap anggota pakai kamera HP (atau cari
     namanya manual kalau QR susah dipindai). Form langsung terbuka: isi
     berapa yang dia jimpitkan untuk Kas dan berapa untuk Tabungan (boleh
     salah satu saja), lalu klik "Selesai & catat hadir".
  4. Anggota itu otomatis tercatat hadir di rapat tersebut, dan jumlah
     Kas + Tabungan yang diisi OTOMATIS menambah Pemasukan di menu Keuangan
     (dengan kategori "Jimpitan Kas" / "Jimpitan Tabungan" agar mudah
     dipisahkan di Laporan).
  5. Kalau ada yang keliru input, hapus barisnya di log "Sudah tercatat di
     rapat ini" — transaksi Kas/Tabungan yang tadi otomatis dibuat ikut
     terhapus juga (supaya Pemasukan di Keuangan tetap akurat).
  Catatan: fitur Absensi lama (QR per rumah, discan sendiri oleh anggota)
  sudah digantikan oleh Jimpitan ini. Halaman "Absensi (lama)" masih ada
  untuk melihat arsip lokasi & log lama, tapi anggota tidak lagi bisa
  self-check-in di sana (konsisten dengan aturan "anggota tidak bisa
  menulis data apa pun").

IURAN — QRIS
  Super Admin bisa mengunggah gambar QRIS di menu Pengaturan ("QRIS
  pembayaran iuran"). Setelah diunggah, QRIS itu otomatis muncul di halaman
  Iuran untuk discan siapa saja. Sistem tidak mengecek pembayaran otomatis —
  setelah transfer, anggota mengonfirmasi ke pengurus, lalu Super Admin yang
  menandai status iuran itu jadi Lunas.

LOGIN (Supabase)
  Memakai Supabase Auth. Username diubah menjadi email internal
  (username@akun.remajadamai.id). Matikan "Confirm email" di
  Authentication > Providers > Email, kalau tidak login akan gagal.
  Mode lokal (tanpa API key): akun disimpan di browser, hanya untuk uji coba
  dan TIDAK aman.

CATATAN KEAMANAN
  - Pembatasan tiga peran ini ditegakkan oleh aturan RLS di database.sql,
    bukan cuma di tampilan — jadi tidak bisa dilewati dari browser. Jalankan
    file itu utuh (aman dijalankan ulang di database yang sudah ada — pakai
    IF NOT EXISTS / CREATE OR REPLACE, dan akun lama berperan "Admin" dari
    versi sebelumnya otomatis dinaikkan jadi "Super Admin" saat dijalankan).
  - Dokumentasi berupa link Google Drive (bukan upload file), jadi pastikan
    setiap link diatur "Siapa saja yang punya link" di Google Drive.
  - Nama peminjam dan data pribadi anggota tidak terbaca publik; halaman
    depan hanya memakai view pinjaman_aktif dan anggota_publik.
  - QR pribadi anggota (jimpitan.html?anggota=KODE) tidak memerlukan
    verifikasi lokasi fisik — siapa pun yang memegang KODE itu (misalnya
    dari foto QR yang tersebar) bisa "discan". Risikonya rendah karena yang
    menentukan jumlah uang & mengeksekusi pencatatan tetap Super Admin
    (anggota tidak bisa menginput apa pun sendiri), tapi tetap jangan sebar
    screenshot QR orang lain sembarangan.

DATA AWAL
  Semua data (kegiatan, event, pinjaman, nama-nama, inventaris, dll) kosong.
  Isi lewat panel pengurus setelah login.
