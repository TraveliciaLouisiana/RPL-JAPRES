function render() {
  refreshShell();
  const g = getMyGroup(), c = getCourse(), locked = isLocked();

  // Pemberitahuan jika Dosen sudah mengunci jadwal
  document.getElementById("lockNotice").innerHTML = locked
    ? `<div class="info-bar warn"><span><b>Jadwal sudah dikunci oleh Dosen.</b> Anggota kelompok tidak dapat keluar atau berpindah kelompok.</span></div>` : "";

  // Kartu kelompok sendiri
  const n = g ? membersOf(g).length : 0;
  document.getElementById("groupCard").innerHTML = g ? `
    <div class="avatar num">${g.id}</div>
    <div class="grow"><h3>Kelompok ${g.id} <span class="status-pill ${locked ? "pill-ok" : "pill-warn"}">${locked ? "Jadwal dikunci" : "Belum dikunci"}</span></h3>
      <p>${c.short} • Kelas ${c.kelas} • ${n} dari ${MAX_MEMBERS} anggota</p></div>
    <button class="leave-btn" id="leaveBtn">Keluar Kelompok</button>` : `
    <div class="avatar num">–</div>
    <div class="grow"><h3>Belum bergabung <span class="status-pill pill-warn">Belum ada kelompok</span></h3>
      <p>${c.short} • Kelas ${c.kelas} • Masuk ke kelompok yang tersedia atau buat kelompok baru</p></div>`;

  // Jadwal presentasi (Hari, Tanggal, Jam, Ruangan) atau info belum ditetapkan
  const bar = document.getElementById("scheduleBar"), s = g && g.schedule;
  if (!g) bar.className = "info-bar hidden";
  else if (!s) { bar.className = "info-bar warn"; bar.innerHTML = `<span><b>Jadwal presentasi belum tersedia.</b> Dosen belum menetapkan jadwal untuk Kelompok ${g.id}.</span>`; }
  else { bar.className = "info-bar notice";
    bar.innerHTML = [["Jadwal Presentasi", `Kelompok ${g.id}`], ["Hari", s.day], ["Tanggal", s.date], ["Jam", `${s.start}–${s.end} WIB`], ["Ruangan", `${s.room} ${s.building}`]]
      .map(x => `<div class="seg"><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join(""); }

  renderOwn(g); renderOthers();
}

// Tabel anggota: hanya Nama dan NPM
function renderOwn(g) {
  const panel = document.getElementById("ownPanel");
  panel.classList.toggle("hidden", !g); if (!g) return;
  const list = membersOf(g);
  panel.innerHTML = `<div class="panel-top"><div><h2>Anggota Kelompok ${g.id}</h2><p>Daftar mahasiswa yang tergabung dalam kelompok Anda.</p></div></div>
    <div class="table-wrap"><table><thead><tr><th>Nama mahasiswa</th><th>NPM</th></tr></thead><tbody>
    ${list.map(m => `<tr class="${m.me ? "me" : ""}"><td><b>${esc(m.name)}</b>${m.me ? '<span class="you">Anda</span>' : ""}</td><td>${m.npm}</td></tr>`).join("")}
    </tbody></table></div>`;
}

function renderOthers() {
  const others = allGroups().filter(g => g.id !== getMyGroupId()), box = document.getElementById("groupList");
  if (!others.length) { box.innerHTML = `<p class="empty">Belum ada kelompok lain.</p>`; return; }
  box.innerHTML = others.map(g => {
    const n = membersOf(g).length, left = MAX_MEMBERS - n, full = left <= 0;
    return `<article class="group-row ${full ? "full" : ""}">
      <div class="g-name"><b>Kelompok ${g.id}</b><small>${g.members.length ? esc(g.members.map(m => m.name.split(" ")[0]).join(", ")) : "Belum ada anggota"}</small></div>
      <div class="g-count"><b>${n} dari ${MAX_MEMBERS} anggota</b><small class="${full ? "full" : "ok"}">${full ? "Penuh" : `Tersedia • sisa ${left} slot`}</small></div>
      <div class="g-sched"><small>Jadwal presentasi</small><b class="${g.schedule ? "" : "none"}">${g.schedule ? `${g.schedule.day}, ${g.schedule.date.replace(" 2026", "")} · ${g.schedule.start} WIB` : "Belum ditetapkan"}</b></div>
      <div class="g-end">${full ? "" : `<button class="join-btn" data-join="${g.id}">Masuk Kelompok</button>`}</div>
    </article>`;
  }).join("");
}

// Penolakan sistem: dialog satu tombol
const reject = (title, msg) => dialog({ title, body: `<p>${msg}</p>`, ok: "Mengerti", cancel: null });

function tryJoin(id) {
  if (getMyGroupId()) return reject("Tidak dapat masuk kelompok", `Anda sudah tergabung di Kelompok ${getMyGroupId()}. Setiap mahasiswa hanya dapat berada di maksimal 1 kelompok per mata kuliah. Keluar dari kelompok Anda terlebih dahulu.`);
  if (isLocked()) return reject("Jadwal sudah dikunci", "Dosen sudah mengunci jadwal, sehingga Anda tidak dapat masuk ke kelompok.");
  const g = allGroups().find(x => x.id === id);
  dialog({ title: `Masuk ke Kelompok ${id}?`, ok: "Ya, masuk",
    body: `<p>Anggota saat ini: ${membersOf(g).length} dari ${MAX_MEMBERS}.<br>Jadwal presentasi: ${g.schedule ? fmtSchedule(g.schedule) : "belum ditetapkan Dosen"}.</p>`,
    onOk: () => { joinGroup(id); render(); showToast(`Anda masuk ke Kelompok ${id}`); } });
}
function tryCreate() {
  if (getMyGroupId()) return reject("Tidak dapat membuat kelompok", `Anda sudah tergabung di Kelompok ${getMyGroupId()}. Maksimal 1 kelompok per mata kuliah untuk setiap mahasiswa.`);
  if (isLocked()) return reject("Jadwal sudah dikunci", "Dosen sudah mengunci jadwal, sehingga kelompok baru tidak dapat dibuat.");
  dialog({ title: "Buat kelompok baru?", ok: "Simpan",
    body: `<p>Kelompok baru akan dibuat dan Anda tercatat sebagai anggota pertama. Jadwal presentasi ditetapkan oleh Dosen.</p>`,
    onOk: () => { const id = createGroup(); render(); showToast(`Kelompok ${id} berhasil dibuat`); } });
}
function tryLeave() {
  const id = getMyGroupId();
  if (isLocked()) return reject("Tidak dapat keluar kelompok", "Jadwal sudah dikunci oleh Dosen, sehingga Anda tidak dapat keluar dari kelompok.");
  dialog({ title: `Keluar dari Kelompok ${id}?`, ok: "Ya, keluar", danger: true,
    body: `<p>Keanggotaan Anda akan dihapus dan slot Anda terbuka untuk mahasiswa lain.</p>`,
    onOk: () => { leaveGroup(); render(); showToast(`Anda keluar dari Kelompok ${id}`); } });
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", e => {
    const join = e.target.closest("[data-join]"); if (join) tryJoin(+join.dataset.join);
    if (e.target.closest("#leaveBtn")) tryLeave();
    if (e.target.closest("#newGroupBtn")) tryCreate();
  });
  document.addEventListener("japres:change", render);
  render();
});
