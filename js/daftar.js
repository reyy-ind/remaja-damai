(async () => {
  if (Auth.user()) return location.replace('dashboard.html');
  const s = await Settings.get();
  document.title = `Daftar akun — ${s.nama}`;
  $('#app').innerHTML = `<div class="auth"><div class="card"><a class="brand" href="index.html"><img src="${CONFIG.LOGO}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(s.singkatan)}</span></a>
  <h1>Daftar akun anggota</h1><p class="muted sm" style="margin-bottom:18px">Akun baru aktif setelah disetujui admin. Setelah aktif, kamu bisa melihat info organisasi dan menunjukkan QR pribadimu ke pengurus untuk absen & jimpitan saat kumpul.</p>
  <form id="f"><div class="f"><label for="nm">Nama lengkap</label><input id="nm" required autocomplete="name"></div><div class="f"><label for="u">Username</label><input id="u" required autocomplete="username" pattern="[A-Za-z0-9._\\-]{3,30}" title="3–30 karakter: huruf, angka, titik, garis bawah, strip"></div><div class="f"><label for="p">Password (min. 8 karakter)</label><input id="p" type="password" required minlength="8" autocomplete="new-password"></div><div class="err" id="err"></div><div id="ok" class="in sm" style="margin-bottom:10px"></div>
  <button class="btn pri" style="width:100%;justify-content:center">Daftar</button></form>
  <p class="sm" style="text-align:center;margin-top:16px">Sudah punya akun? <a class="in" href="login.html">Masuk</a></p></div></div>`;
  $('#f').onsubmit = async e => {
    e.preventDefault(); $('#err').textContent = '';
    const u = $('#u').value, p = $('#p').value;
    try { await Auth.register(u, $('#nm').value.trim(), p); } catch (er) { return $('#err').textContent = er.message; }
    try { await Auth.login(u, p); location.href = 'dashboard.html'; }
    catch (er) { if (/belum aktif/i.test(er.message)) { $('#ok').textContent = 'Pendaftaran berhasil. Akunmu menunggu persetujuan admin, lalu kamu bisa masuk.'; e.target.reset(); } else $('#err').textContent = er.message; }
  };
})();
