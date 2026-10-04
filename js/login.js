(async () => {
  if (Auth.user()) return location.replace('dashboard.html');
  const s = await Settings.get();
  document.title = `Masuk — ${s.nama}`;
  $('#app').innerHTML = `<div class="auth"><div class="card"><a class="brand" href="index.html"><img src="${CONFIG.LOGO}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(s.singkatan)}</span></a>
  <h1>Masuk basecamp</h1><p class="muted sm" style="margin-bottom:18px">Admin dan anggota masuk dari sini. ${esc(s.nama)}</p>
  <form id="f"><div class="f"><label for="u">Username</label><input id="u" required autocomplete="username"></div><div class="f"><label for="p">Password</label><input id="p" type="password" required autocomplete="current-password"></div><div class="err" id="err"></div>
  <button class="btn pri" style="width:100%;justify-content:center">Masuk</button></form>
  <p class="sm" style="text-align:center;margin-top:16px">Belum punya akun? <a class="in" href="daftar.html">Daftar sebagai anggota</a></p>
  <p style="text-align:center;margin-top:8px"><a class="muted sm" href="index.html">← Kembali ke beranda</a></p></div></div>`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    try {
      await Auth.login($('#u').value, $('#p').value);
      const ret = localStorage.getItem('rd_return');
      if (ret) { localStorage.removeItem('rd_return'); location.href = ret; } else location.href = 'dashboard.html';
    } catch (er) { $('#err').textContent = er.message; }
  };
})();
