-- Jalankan di Supabase: SQL Editor -> New query -> Run.
-- Sebelumnya: Authentication > Providers > Email > matikan "Confirm email".
-- Akun PERTAMA yang mendaftar otomatis menjadi SUPER ADMIN. Daftarkan akun itu segera setelah ini.
-- Aman dijalankan ulang di database yang sudah berisi data (IF NOT EXISTS / CREATE OR REPLACE di mana-mana).

-- ===== Tabel data =====
create table if not exists anggota (id text primary key, created_at timestamptz default now(), dibuat_oleh text, nama text, jabatan text, rt text, hp text, alamat text, status text);
create table if not exists kegiatan (id text primary key, created_at timestamptz default now(), dibuat_oleh text, judul text, jenis text, tanggal date, waktu text, lokasi text, target numeric, budget numeric, progress numeric, status text, deskripsi text, publik boolean default true);
create table if not exists transaksi (id text primary key, created_at timestamptz default now(), dibuat_oleh text, tanggal date, jenis text, kategori text, keterangan text, jumlah numeric, kegiatan_terkait text, publik boolean default true);
create table if not exists inventaris (id text primary key, created_at timestamptz default now(), dibuat_oleh text, nama text, kategori text, total numeric, kondisi text, keterangan text);
create table if not exists pinjaman (id text primary key, created_at timestamptz default now(), dibuat_oleh text, peminjam text, barang text, jumlah numeric, tgl_pinjam date, tgl_kembali date, status text, catatan text);
create table if not exists iuran (id text primary key, created_at timestamptz default now(), dibuat_oleh text, anggota text, periode text, jumlah numeric, status text, tgl_bayar date);
create table if not exists dokumentasi (id text primary key, created_at timestamptz default now(), dibuat_oleh text, link text, judul text, kegiatan text, tanggal date, publik boolean default false);
create table if not exists arsip_rapat (id text primary key, created_at timestamptz default now(), dibuat_oleh text, judul text, tanggal date, tempat text, notulen text, lampiran text);
create table if not exists achievement (id text primary key, created_at timestamptz default now(), dibuat_oleh text, judul text, deskripsi text, tingkat text, target numeric, progress numeric);
create table if not exists notifikasi (id text primary key, created_at timestamptz default now(), dibuat_oleh text, judul text, pesan text, tipe text, tanggal date);
create table if not exists pengaturan (id text primary key, created_at timestamptz default now(), nama text, singkatan text, alamat text, wa text, instagram text, tentang text);
alter table pengaturan add column if not exists qris text;

-- Kode QR pribadi tiap anggota (dipakai admin untuk scan absensi + jimpitan).
alter table anggota add column if not exists kode text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'anggota_kode_key') then
    alter table anggota add constraint anggota_kode_key unique (kode);
  end if;
end $$;

-- Permintaan perubahan (peninggalan versi verifikasi lama) — tidak dipakai lagi sejak anggota tidak bisa
-- menulis data apa pun, tapi tabelnya dibiarkan ada (tidak dihapus) supaya tidak ada migrasi destruktif.
create table if not exists permintaan (id text primary key, created_at timestamptz default now(), dibuat_oleh text, tabel text, row_id text, aksi text, data_baru text, status text default 'Menunggu');

-- Absensi lama (QR per rumah, arsip/riwayat) — dipertahankan untuk histori, tidak lagi dipakai anggota.
create table if not exists lokasi_absen (id text primary key, created_at timestamptz default now(), dibuat_oleh text, nama text, alamat text, kegiatan text, kode text unique, aktif boolean default true);
create table if not exists absensi (id text primary key, created_at timestamptz default now(), dibuat_oleh text, nama text, lokasi_id text, lokasi_nama text, kode text);

-- Jimpitan: admin scan QR pribadi anggota saat kumpul -> absen + catat kas/tabungan sekaligus, terhubung ke satu Arsip Rapat.
create table if not exists jimpitan (id text primary key, created_at timestamptz default now(), dibuat_oleh text, anggota_id text, anggota_nama text, rapat_id text, rapat_judul text, kas numeric default 0, tabungan numeric default 0, transaksi_ids text);

-- Migrasi dari versi lama (aman dijalankan ulang):
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'dokumentasi' and column_name = 'foto')
     and not exists (select 1 from information_schema.columns where table_name = 'dokumentasi' and column_name = 'link') then
    alter table dokumentasi rename column foto to link;
  end if;
end $$;
-- Akun lama berperan 'Admin' (sebelum ada Super Admin/Admin biasa) dinaikkan jadi Super Admin, supaya tidak ada yang kehilangan akses penuh.
update profiles set peran = 'Super Admin' where peran = 'Admin';

-- ===== Profil akun (terhubung ke Supabase Auth) =====
create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now(), username text unique, nama text, peran text default 'Anggota', aktif boolean default false);

-- Kode acak 8 karakter (tanpa huruf/angka yang gampang tertukar: 0/O, 1/I/L) untuk QR pribadi anggota.
create or replace function buat_kode_anggota() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random()*32)+1)::int, 1), '') from generate_series(1,8)
$$;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare pertama boolean;
begin
  select count(*) = 0 into pertama from profiles;
  insert into profiles (id, username, nama, peran, aktif)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'nama', case when pertama then 'Super Admin' else 'Anggota' end, pertama);
  -- Setiap akun baru otomatis menjadi satu baris di tabel anggota (tidak perlu input manual lagi), lengkap dengan kode QR pribadi.
  insert into anggota (id, dibuat_oleh, nama, status, kode)
  values (new.id::text, new.id::text, new.raw_user_meta_data->>'nama', case when pertama then 'Aktif' else 'Nonaktif' end, buat_kode_anggota());
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Saat admin menyetujui akun (aktif) atau mengubah nama profil, ikut sinkron ke tabel anggota.
create or replace function sync_anggota_dari_profil() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.aktif is distinct from old.aktif or new.nama is distinct from old.nama then
    update anggota set status = case when new.aktif then 'Aktif' else 'Nonaktif' end, nama = coalesce(new.nama, nama) where id = new.id::text;
  end if;
  return new;
end $$;
drop trigger if exists on_profile_updated on profiles;
create trigger on_profile_updated after update on profiles for each row execute function sync_anggota_dari_profil();

-- is_super()  : Super Admin aktif -> akses penuh ke semua tabel.
-- is_staff()  : Super Admin ATAU Admin biasa aktif -> akses penuh khusus Inventaris & Dokumentasi.
-- is_member() : siapa pun yang aktif (peran apapun) -> baca data bersama (arsip rapat, notifikasi, dll).
create or replace function is_super() returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and peran = 'Super Admin' and aktif) $$;
create or replace function is_staff() returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and peran in ('Super Admin','Admin') and aktif) $$;
create or replace function is_member() returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and aktif) $$;

-- ===== View publik (hanya kolom aman, tanpa nama peminjam / data pribadi anggota) =====
create or replace view pinjaman_aktif as select barang, jumlah from pinjaman where status = 'Dipinjam';
create or replace view anggota_publik as select id from anggota where coalesce(status, 'Aktif') <> 'Nonaktif';
grant select on pinjaman_aktif, anggota_publik to anon, authenticated;

-- ===== Row Level Security =====
-- Grup 1: akses penuh (tulis) HANYA Super Admin.
do $$ declare t text; begin
  foreach t in array array['anggota','kegiatan','transaksi','pinjaman','iuran','arsip_rapat','achievement','notifikasi','pengaturan','profiles','permintaan','lokasi_absen','absensi','jimpitan'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "akses_anon" on %I', t);
    execute format('drop policy if exists admin_all on %I', t);
    execute format('create policy admin_all on %I for all to authenticated using (is_super()) with check (is_super())', t);
  end loop;
end $$;
-- Grup 2: akses penuh (tulis) untuk Super Admin MAUPUN Admin biasa.
do $$ declare t text; begin
  foreach t in array array['inventaris','dokumentasi'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "akses_anon" on %I', t);
    execute format('drop policy if exists admin_all on %I', t);
    execute format('create policy admin_all on %I for all to authenticated using (is_staff()) with check (is_staff())', t);
  end loop;
end $$;

-- profiles: pengguna hanya membaca profilnya sendiri; perubahan peran/aktif hanya Super Admin (admin_all).
drop policy if exists profil_baca on profiles;
create policy profil_baca on profiles for select to authenticated using (id = auth.uid());

-- anggota: setiap akun boleh membaca BARIS MILIKNYA SENDIRI saja (untuk menampilkan QR pribadinya sendiri).
drop policy if exists m_ag_own on anggota;
create policy m_ag_own on anggota for select to authenticated using (id = auth.uid()::text);

-- Halaman publik (tanpa login)
drop policy if exists pub_inventaris on inventaris; create policy pub_inventaris on inventaris for select to anon, authenticated using (true);
drop policy if exists pub_achievement on achievement; create policy pub_achievement on achievement for select to anon, authenticated using (true);
drop policy if exists pub_pengaturan on pengaturan; create policy pub_pengaturan on pengaturan for select to anon, authenticated using (true);
drop policy if exists pub_kegiatan on kegiatan; create policy pub_kegiatan on kegiatan for select to anon, authenticated using (publik = true or is_member());
drop policy if exists pub_transaksi on transaksi; create policy pub_transaksi on transaksi for select to anon, authenticated using (publik = true or is_member());
drop policy if exists pub_dokumentasi on dokumentasi; create policy pub_dokumentasi on dokumentasi for select to anon, authenticated using (publik = true or is_member());

-- Anggota (akun aktif, peran apapun): hanya BACA data bersama. Tidak ada izin insert/update/delete untuk
-- Anggota di tabel manapun selain lewat akun mereka sendiri (lihat m_ag_own di atas) — semua penulisan data
-- sekarang hanya lewat Super Admin (atau Admin biasa khusus Inventaris & Dokumentasi).
drop policy if exists m_arsip on arsip_rapat; create policy m_arsip on arsip_rapat for select to authenticated using (is_member());
drop policy if exists m_notif on notifikasi; create policy m_notif on notifikasi for select to authenticated using (is_member());
-- pinjaman & iuran: anggota melihat baris yang namanya cocok dengan nama akunnya sendiri (admin yang menginput atas nama mereka).
drop policy if exists m_pj_s on pinjaman; create policy m_pj_s on pinjaman for select to authenticated using (peminjam = (select nama from profiles where id = auth.uid()));
drop policy if exists m_iu_s on iuran; create policy m_iu_s on iuran for select to authenticated using (anggota = (select nama from profiles where id = auth.uid()));
-- jimpitan: anggota melihat riwayat jimpitan miliknya sendiri (berdasarkan nama akun).
drop policy if exists m_jmp_s on jimpitan; create policy m_jmp_s on jimpitan for select to authenticated using (anggota_nama = (select nama from profiles where id = auth.uid()));

-- Bersihkan semua izin INSERT/UPDATE/DELETE langsung untuk anggota dari versi-versi sebelumnya
-- (sekarang anggota benar-benar tidak bisa menulis data apa pun; hanya Super Admin / Admin biasa yang menulis):
drop policy if exists m_kg_i on kegiatan; drop policy if exists m_kg_u on kegiatan; drop policy if exists m_kg_d on kegiatan;
drop policy if exists m_pj_i on pinjaman; drop policy if exists m_pj_u on pinjaman; drop policy if exists m_pj_d on pinjaman;
drop policy if exists m_iu_i on iuran; drop policy if exists m_iu_u on iuran; drop policy if exists m_iu_d on iuran;
drop policy if exists m_dk_i on dokumentasi; drop policy if exists m_dk_u on dokumentasi; drop policy if exists m_dk_d on dokumentasi;
drop policy if exists m_lok_s on lokasi_absen;
drop policy if exists m_abs_i on absensi; drop policy if exists m_abs_s on absensi;
drop policy if exists p_perm_i on permintaan; drop policy if exists p_perm_s on permintaan;
