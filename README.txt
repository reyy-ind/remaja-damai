KARANG TARUNA REMAJA DAMAI — Basecamp Pemuda
=============================================
Website statis (HTML + CSS + JavaScript murni, tanpa build). Buka index.html
lewat Live Server (VS Code) atau deploy ke Vercel/Netlify.

STRUKTUR
  index.html, kegiatan.html, kegiatan-detail.html, transparansi.html,
  dokumentasi.html ............ halaman publik
  login.html, daftar.html ..... masuk dan pendaftaran akun anggota
  dashboard, anggota, event, jimpitan, keuangan, iuran, inventaris,
  pinjaman, pinjaman-baru, arsip-rapat, dokumentasi-admin, laporan,
  notifikasi, pengaturan ...... panel pengurus
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
    mana pun untuk anggota — semua data (kegiatan, keuangan, tabungan/kas,
    pinjaman, dokumentasi, dll) hanya diinput/diubah oleh Super Admin (atau
    Admin biasa khusus Inventaris & Dokumentasi). Anggota tetap bisa melihat
    kegiatan, kas, pinjaman miliknya sendiri, rekap tabungan & kas, dokumentasi
    publik, dan mengganti password akunnya sendiri.
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

JIMPITAN (scan kamera QR anggota + kas/tabungan)
  Menu khusus Super Admin. Alurnya:
  1. Buat dulu satu catatan di menu Arsip Rapat (judul & tanggal kumpul).
  2. Buka menu Jimpitan, pilih rapat itu sebagai "Rapat aktif" (tersimpan
     otomatis sampai diganti — jadi tidak perlu dipilih ulang tiap scan).
  3. Klik "Mulai scan kamera" — browser akan minta izin kamera, lalu arahkan
     ke QR kartu anggota. Terdeteksi otomatis (pakai html5-qrcode, tanpa perlu buka
     aplikasi kamera bawaan HP). Kalau kamera tidak tersedia/izin ditolak,
     pakai kolom "Cari anggota manual" di sebelahnya sebagai cadangan.
  4. Form langsung terbuka dengan nama anggota: isi berapa yang dia
     jimpitkan untuk Kas dan berapa untuk Tabungan (boleh salah satu saja),
     lalu klik "Selesai & catat hadir".
  5. Anggota itu otomatis tercatat hadir di rapat tersebut, dan jumlah
     Kas + Tabungan yang diisi OTOMATIS menambah Pemasukan di menu Keuangan
     (kategori "Jimpitan Kas" / "Jimpitan Tabungan" agar mudah dipisahkan
     di Laporan), sekaligus masuk ke rekap bulanan di menu Tabungan & Kas.
  6. Kalau ada yang keliru input, hapus barisnya di log "Sudah tercatat di
     rapat ini" — transaksi Kas/Tabungan yang tadi otomatis dibuat ikut
     terhapus juga (supaya Pemasukan di Keuangan tetap akurat).

TABUNGAN & KAS (menu yang dulu bernama Iuran)
  Rekap otomatis dari data Jimpitan, bukan input manual lagi:
  - Tabel: baris = nama anggota, kolom = 12 bulan tahun berjalan. Tercentang
    (✓) berarti anggota itu jimpitan (kas dan/atau tabungan) pada bulan itu —
    persis seperti buku rekap jimpitan kertas/centang bulanan.
  - Rekap hanya menampilkan TAHUN BERJALAN; begitu tahun berganti, rekap
    tahun lalu otomatis tidak ditampilkan lagi (data lamanya tetap tersimpan
    di database, cuma tidak lagi muncul di tabel rekap).
  - Klik nama anggota mana pun untuk membuka riwayat lengkapnya: tanggal,
    rapat terkait, jumlah Kas & Tabungan tiap transaksi, dan "terakhir
    jimpitan" kapan.
  - Kartu QRIS (diatur Super Admin di menu Pengaturan) tetap tampil di sini
    untuk pembayaran manual non-tunai; pencatatan resminya tetap lewat scan
    QR di menu Jimpitan.

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
  - Pemindaian kamera QR butuh izin kamera browser dan HTTPS. Di komputer,
    localhost/Live Server tetap diizinkan, tapi membuka lewat http://alamat-IP
    dari HP akan DIBLOKIR browser — uji di HP setelah di-deploy (Vercel/GitHub
    Pages, otomatis HTTPS). Setelah scan berhasil dan form ditutup, kamera
    menyala lagi otomatis untuk anggota berikutnya.

FITUR YANG SUDAH DIHAPUS
  Achievement dan Absensi lama (QR per rumah, discan sendiri oleh anggota)
  sudah dihapus total dari aplikasi — digantikan oleh Jimpitan (QR pribadi
  anggota, discan admin) dan rekap Tabungan & Kas. database.sql menghapus
  tabelnya juga kalau masih ada dari instalasi lama.

DATA AWAL
  Semua data (kegiatan, event, pinjaman, nama-nama, inventaris, dll) kosong.
  Isi lewat panel pengurus setelah login.
