(async () => {
  await Admin.shell('Pengaturan', '', '<div class="muted">Memuat…</div>');
  const isSuper = Auth.isSuper(), me = Auth.user(), s = await Settings.get(), UT = Auth.utable();
  const F = [{ k: 'nama', l: 'Nama organisasi', req: 1 }, { k: 'singkatan', l: 'Nama singkat (header)' }, { k: 'alamat', l: 'Alamat sekretariat', t: 'textarea' }, { k: 'wa', l: 'No. WhatsApp (628…)' }, { k: 'instagram', l: 'Username Instagram' }, { k: 'tentang', l: 'Teks "Tentang" di halaman depan (kosongkan untuk teks bawaan)', t: 'textarea' }, { k: 'qris', l: 'QRIS pembayaran iuran (gambar)', t: 'image' }];
  const PERAN = ['Anggota', 'Admin', 'Super Admin'];
  let users = isSuper ? await DB.list(UT).catch(() => []) : [];
  const pwCard = `<div class="card"><h3 style="margin-bottom:14px">Ganti password saya</h3><form id="fp"><div class="f"><label for="pw1">Password baru (min. 8 karakter)</label><input id="pw1" type="password" minlength="8" required autocomplete="new-password"></div><div class="err" id="e2"></div><button class="btn pri">Ganti password</button></form></div>`;
  const draw = () => {
    const pending = users.filter(u => u.aktif === false);
    $('#content').innerHTML = isSuper ? `<div class="grid g2" style="align-items:start"><div class="card"><h3 style="margin-bottom:14px">Profil organisasi</h3><form id="fo">${Form.build(F, s)}<div class="err" id="e1"></div><button class="btn pri">Simpan pengaturan</button></form></div>
    <div>${pwCard}<div class="card" style="margin-top:16px"><h3 style="margin-bottom:4px">Akun</h3><p class="muted sm" style="margin-bottom:10px">${pending.length ? `${pending.length} akun menunggu persetujuan.` : 'Tidak ada akun yang menunggu persetujuan.'}</p>
    ${users.map(u => `<div class="tx"><div><b>${esc(u.nama || u.username)}</b><span class="muted sm">${esc(u.username)}</span><div style="margin-top:4px">${statusBadge(u.peran === 'Anggota' ? 'Anggota' : u.peran === 'Admin' ? 'Admin' : 'Super Admin')} ${u.aktif === false ? '<span class="badge warn">Menunggu</span>' : '<span class="badge ok">Aktif</span>'}</div></div>
    <div class="acts" style="flex-wrap:wrap;align-content:flex-start">${u.id === me.id ? '<span class="badge ok">Kamu</span>' : `${u.aktif === false ? `<button class="btn xs pri" data-a="on" data-id="${u.id}">Setujui</button>` : `<button class="btn xs dn" data-a="off" data-id="${u.id}">Nonaktifkan</button>`}<select data-role="${u.id}" style="padding:4px 8px;border-radius:8px;background:var(--bg);border:1px solid var(--line);color:var(--tx)">${PERAN.map(p => `<option ${p === u.peran ? 'selected' : ''}>${p}</option>`).join('')}</select>`}</div></div>`).join('') || Pub.empty('Belum ada akun.')}</div></div></div>` : `<div style="max-width:480px">${pwCard}</div>`;
    if (isSuper) {
      $('#fo').onsubmit = async e => { e.preventDefault(); const d = await Form.read(F); try { const cur = (await DB.list('pengaturan'))[0]; cur ? await DB.update('pengaturan', cur.id, d) : await DB.add('pengaturan', d); Settings._c = null; toast('Pengaturan tersimpan'); } catch (er) { $('#e1').textContent = er.message; } };
      $$('[data-a]').forEach(b => b.onclick = async () => {
        const u = users.find(x => x.id === b.dataset.id), a = b.dataset.a;
        try { await DB.update(UT, u.id, a === 'on' ? { aktif: true } : { aktif: false }); users = await DB.list(UT); toast('Akun diperbarui'); draw(); } catch (er) { toast(er.message, 1); }
      });
      $$('[data-role]').forEach(sel => sel.onchange = async () => {
        const u = users.find(x => x.id === sel.dataset.role), baru = sel.value;
        if (!confirm(`Jadikan akun "${u.nama || u.username}" sebagai ${baru}?`)) { sel.value = u.peran; return; }
        try { await DB.update(UT, u.id, { peran: baru }); users = await DB.list(UT); toast('Peran diperbarui'); draw(); } catch (er) { toast(er.message, 1); }
      });
    }
    $('#fp').onsubmit = async e => { e.preventDefault(); try { await Auth.changePassword($('#pw1').value); toast('Password diganti'); e.target.reset(); } catch (er) { $('#e2').textContent = er.message; } };
  };
  draw();
})();
