/* =====================================================================
   kelompok.js  —  Halaman "Informasi Kelompok"

   ALUR (sesuai konsep dosen-mahasiswa):
   1. Dosen membuat sejumlah kelompok (awalnya kosong).
   2. Mahasiswa menekan [Pilih] pada satu kelompok, lalu menekan [Simpan]  -> resmi bergabung
      (bila sebelumnya sudah di kelompok lain, otomatis PINDAH). Selama belum dikunci boleh pindah / keluar.
   3. Dosen mengunci kelompok  -> mahasiswa TIDAK bisa pindah lagi; hanya bisa melihat nama, NPM, dan jadwal presentasi.
   4. Jadwal presentasi baru muncul SETELAH dikunci (backend tidak mengirimnya sebelum itu).

   Fungsi bersama (getCourse, allGroups, dialog, esc, saveGroup, dll.) ada di /common/global.js
   ===================================================================== */

let pilihan = null;   // id kelompok yang sedang DIPILIH tapi BELUM disimpan (null = belum memilih)

const isFull = g => membersOf(g).length >= maxMembers();

function render() {
  refreshShell();
  const locked = isLocked();

  // Pilihan dibatalkan otomatis bila sudah dikunci, atau kelompok pilihan ternyata hilang / penuh
  if (pilihan) {
    const g = allGroups().find(x => x.id === pilihan);
    if (locked || !g || isFull(g)) pilihan = null;
  }

  // Keterangan tahap yang sedang berjalan
  document.getElementById("lockNotice").innerHTML = locked
    ? `<div class="info-bar warn"><span><b>Kelompok sudah dikunci oleh Dosen.</b> Anda tidak dapat pindah kelompok. Anda hanya dapat melihat nama &amp; NPM anggota serta jadwal presentasi.</span></div>`
    : `<div class="info-bar notice"><span><b>Pemilihan kelompok sedang dibuka.</b> Pilih satu kelompok lalu klik <b>Simpan</b>. Selama belum dikunci, Anda masih boleh pindah. Jadwal presentasi diumumkan setelah Dosen mengunci kelompok.</span></div>`;

  renderGroups(locked);
  renderSaveBar(locked);
}

// Daftar kelompok. Sebelum dikunci: kolom jadwal TIDAK ada. Setelah dikunci: kolom jadwal muncul, tombol pilih hilang.
function renderGroups(locked) {
  const box = document.getElementById("groupList");
  const myId = getMyGroupId();
  const groups = allGroups().sort((a, b) => (b.id === myId) - (a.id === myId));   // kelompok saya paling atas

  if (!groups.length) {
    box.innerHTML = `<p class="empty">Dosen belum membuat kelompok untuk mata kuliah ini. Kelompok akan muncul di sini setelah Dosen menetapkan jumlah kelompok.</p>`;
    return;
  }

  box.innerHTML = groups.map(g => {
    const mine = g.id === myId, sel = g.id === pilihan, full = isFull(g);
    const n = membersOf(g).length, left = maxMembers() - n;

    // Tombol aksi (hanya sebelum dikunci)
    let pick = "";
    if (!locked) {
      if (mine) pick = `<button class="pick-btn saved" disabled>✓ Tergabung</button>`;
      else if (full) pick = `<button class="pick-btn" disabled>Penuh</button>`;
      else pick = `<button class="pick-btn ${sel ? "on" : ""}" data-pick="${esc(g.id)}">${sel ? "✓ Dipilih" : "Pilih"}</button>`;
    }

    const sched = locked
      ? `<div class="g-sched"><small>Jadwal presentasi</small><b class="${g.schedule ? "" : "none"}">${g.schedule ? esc(`${g.schedule.day}, ${g.schedule.date.replace(/ \d{4}$/, "")} · ${g.schedule.start} WIB`) : "Belum ditetapkan Dosen"}</b></div>` : "";

    return `<article class="group-row ${locked ? "with-sched" : ""} ${full ? "full" : ""} ${mine ? "mine" : ""} ${sel ? "selected" : ""}">
      <div class="g-name">
        <b>Kelompok ${esc(g.nomor)}${mine ? '<span class="you">Anda</span>' : ""}</b>
        <small>${g.members.length ? esc(g.members.map(m => m.name.split(" ")[0]).join(", ")) : "Belum ada anggota"}</small>
      </div>
      <div class="g-count">
        <b>${n} dari ${maxMembers()} anggota</b>
        <small class="${full ? "full" : "ok"}">${full ? "Penuh" : `Tersedia • sisa ${left} slot`}</small>
      </div>
      ${sched}
      <div class="g-end">
        <button class="info-btn" data-info="${esc(g.id)}">Info Mahasiswa</button>
        ${pick}
      </div>
    </article>`;
  }).join("");
}

// Bar di bawah daftar: penjelasan pilihan + tombol Simpan (hanya sebelum dikunci)
function renderSaveBar(locked) {
  const bar = document.getElementById("saveBar");
  bar.classList.toggle("hidden", locked || !allGroups().length);
  if (locked) return;

  const my = getMyGroup(), pg = pilihan && allGroups().find(x => x.id === pilihan);
  let msg;
  if (pg) msg = my ? `Anda memilih <b>Kelompok ${esc(pg.nomor)}</b>. Klik Simpan untuk pindah dari Kelompok ${esc(my.nomor)}.`
                   : `Anda memilih <b>Kelompok ${esc(pg.nomor)}</b>. Klik Simpan untuk bergabung.`;
  else if (my) msg = `Anda sudah tergabung di <b>Kelompok ${esc(my.nomor)}</b>. Pilih kelompok lain bila ingin pindah.`;
  else msg = `Anda belum bergabung. Pilih salah satu kelompok di atas, lalu klik Simpan.`;

  bar.innerHTML = `<p class="save-msg">${msg}</p>
    <div class="save-actions">
      ${pg ? `<button class="soft-btn" id="cancelPick">Batalkan pilihan</button>` : (my ? `<button class="leave-btn" data-leave="1">Keluar Kelompok</button>` : "")}
      <button class="primary-btn" id="saveBtn" ${pg ? "" : "disabled"}>Simpan</button>
    </div>`;
}

// Popup "Info Mahasiswa": nama + NPM anggota; jadwal presentasi hanya bila sudah dikunci
function showInfo(id) {
  const g = allGroups().find(x => x.id === id); if (!g) return;
  const c = getCourse(), list = membersOf(g);
  const jadwal = !isLocked() ? "Akan diumumkan setelah Dosen mengunci kelompok."
    : g.schedule ? `${esc(fmtSchedule(g.schedule))}<br>Ruang ${esc(g.schedule.room)}` : "Belum ditetapkan Dosen.";

  dialog({
    title: `Kelompok ${g.nomor}`, ok: "Tutup", cancel: null,   // cancel:null = hanya satu tombol
    body: `
      <p class="info-meta">${esc(c.short)} • Kelas ${esc(c.kelas)} • ${list.length} dari ${maxMembers()} anggota</p>
      <h4 class="info-sub">Anggota Kelompok</h4>
      ${list.length
        ? `<ul class="mini-list">${list.map(m => `<li class="${m.me ? "me" : ""}"><span><b>${esc(m.name)}</b>${m.me ? '<span class="you">Anda</span>' : ""}</span><span class="npm">${esc(m.npm)}</span></li>`).join("")}</ul>`
        : `<p class="empty">Belum ada anggota.</p>`}
      <h4 class="info-sub">Jadwal Presentasi</h4>
      <p class="info-meta">${jadwal}</p>`
  });
}

// Penolakan sistem: dialog satu tombol
const reject = (title, msg) => dialog({ title, body: `<p>${esc(msg)}</p>`, ok: "Mengerti", cancel: null });

// Dipanggil bila aksi ke server gagal (mis. kelompok baru saja penuh / baru dikunci): muat ulang data lalu tampilkan alasannya.
async function gagal(judul, e) {
  pilihan = null;
  try { await loadGroups(); } catch {}
  render();
  reject(judul, e.message);
}

// Tombol Simpan
async function doSave() {
  if (!pilihan) return;
  const g = allGroups().find(x => x.id === pilihan); if (!g) return;
  try {
    await saveGroup(pilihan);                  // PUT /api/portal/kelompok/{id}/simpan
    pilihan = null; render();
    showToast(`Tersimpan. Anda tergabung di Kelompok ${g.nomor}`);
  } catch (e) { gagal("Tidak dapat menyimpan", e); }
}

function tryLeave() {
  const g = getMyGroup(); if (!g) return;
  if (isLocked()) return reject("Tidak dapat keluar kelompok", "Kelompok sudah dikunci oleh Dosen, sehingga Anda tidak dapat keluar dari kelompok.");
  dialog({ title: `Keluar dari Kelompok ${g.nomor}?`, ok: "Ya, keluar", danger: true,
    body: `<p>Keanggotaan Anda akan dihapus dan slot Anda terbuka untuk mahasiswa lain.</p>`,
    onOk: async () => {
      try { await leaveGroup(); pilihan = null; render(); showToast(`Anda keluar dari Kelompok ${g.nomor}`); }
      catch (e) { gagal("Tidak dapat keluar kelompok", e); }
    } });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Satu pendengar klik untuk semua tombol (delegasi event), karena isi daftar digambar ulang terus
  document.addEventListener("click", e => {
    const pick = e.target.closest("[data-pick]");
    if (pick) { pilihan = pilihan === pick.dataset.pick ? null : pick.dataset.pick; render(); return; }   // klik lagi = batal pilih
    const info = e.target.closest("[data-info]");  if (info) showInfo(info.dataset.info);
    if (e.target.closest("#saveBtn")) doSave();
    if (e.target.closest("#cancelPick")) { pilihan = null; render(); }
    if (e.target.closest("[data-leave]")) tryLeave();
  });
  if (!(await appReady)) return;
  document.addEventListener("japres:change", () => { pilihan = null; render(); });
  render();
});
