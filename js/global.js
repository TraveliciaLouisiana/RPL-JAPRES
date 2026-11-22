/* ===== JAPRES: data & fungsi bersama ===== */
const LOGIN_URL = "login.html";          // halaman login dikerjakan teman: sesuaikan path-nya
const SESSION_MS = 30 * 60 * 1000;       // sesi berakhir setelah 30 menit tanpa aktivitas
const MAX_MEMBERS = 3;                   // kuota anggota per kelompok

const STUDENT = {
  name: "Vivian Kimora", npm: "6182601002", email: "6182601002@student.unpar.ac.id",
  prodi: "Informatika", angkatan: "2026", tahun: "2026/2027", status: "Mahasiswa Aktif"
};
// Mata kuliah semester berjalan yang memiliki tugas besar (sesuai tabel Mata_Kuliah + Tugas_Besar)
const COURSES = [
  { short: "RPL", kode: "AIF233101", name: "Rekayasa Perangkat Lunak", sks: 3, classes: ["A", "B"] },
  { short: "PBW", kode: "AIF233201", name: "Pemrograman Berbasis Web", sks: 3, classes: ["A", "B"] },
  { short: "KB", kode: "AIF233301", name: "Kecerdasan Buatan", sks: 3, classes: ["A", "B"] },
  { short: "DAG", kode: "AIF233401", name: "Desain Antarmuka Grafis", sks: 3, classes: ["A", "B"] },
  { short: "MP", kode: "AIF233501", name: "Manajemen Proyek", sks: 2, classes: ["A", "B"] },
  { short: "VD", kode: "AIF233601", name: "Visualisasi Data", sks: 3, classes: ["A", "B"] }
];
const ROOM = { room: "Lab. 09.00.0017", building: "Semi Basement Gd.9", mode: "Luring" };
// Jadwal ditetapkan Dosen. schedule: null = belum ditetapkan.
const GROUPS = [
  { id: 1, schedule: { day: "Rabu", date: "16 Desember 2026", start: "10.30", end: "11.00", ...ROOM },
    members: [{ name: "Arya Dimas Prakoso", npm: "6182601001" }, { name: "Prakoso Dimas Arya", npm: "6182601003" }] },
  { id: 2, schedule: { day: "Rabu", date: "16 Desember 2026", start: "11.00", end: "11.30", ...ROOM },
    members: [{ name: "Nadia Putri Lestari", npm: "6182601011" }, { name: "Kevin Alexander", npm: "6182601012" }] },
  { id: 3, schedule: { day: "Kamis", date: "17 Desember 2026", start: "08.00", end: "08.30", ...ROOM },
    members: [{ name: "Michelle Tan", npm: "6182601013" }, { name: "Rafael Santoso", npm: "6182601014" }, { name: "Grace Wijaya", npm: "6182601015" }] },
  { id: 4, schedule: null, members: [{ name: "Bryan Hartono", npm: "6182601016" }] },
  { id: 5, schedule: { day: "Kamis", date: "17 Desember 2026", start: "09.00", end: "09.30", ...ROOM },
    members: [{ name: "Felicia Anggraini", npm: "6182601021" }, { name: "Jonathan Kusuma", npm: "6182601022" }, { name: "Hendrik Wibowo", npm: "6182601042" }] }
];

/* ----- Penyimpanan sederhana (localStorage) ----- */
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
// Simulasi lewat URL: ?dikunci=1 (Dosen mengunci jadwal), ?dikunci=0 (buka), ?reset=1 (data awal)
(() => {
  const q = new URLSearchParams(location.search);
  if (q.get("reset") === "1") ["jp_group", "jp_course", "jp_kelas", "jp_newGroup", "jp_events", "jp_dikunci"].forEach(store.del);
  if (q.has("dikunci")) store.set("jp_dikunci", q.get("dikunci") === "1");
})();

/* ----- Status mahasiswa ----- */
const isLocked = () => store.get("jp_dikunci", false);
const allGroups = () => { const n = store.get("jp_newGroup"); return n ? [...GROUPS, n] : GROUPS; };
const getMyGroupId = () => store.get("jp_group", 1) || null;      // false = belum punya kelompok
const getMyGroup = () => allGroups().find(g => g.id === getMyGroupId()) || null;
const getCourse = () => ({ ...(COURSES.find(c => c.short === store.get("jp_course", "RPL")) || COURSES[0]), kelas: store.get("jp_kelas", "A") });
const membersOf = g => [...g.members, ...(g.id === getMyGroupId() ? [{ name: STUDENT.name, npm: STUDENT.npm, me: true }] : [])];

function joinGroup(id) { store.set("jp_group", id); }
function leaveGroup() {
  const n = store.get("jp_newGroup");
  if (n && n.id === getMyGroupId()) store.del("jp_newGroup");     // kelompok buatan sendiri hilang jika kosong
  store.set("jp_group", false);
}
function createGroup() {
  const id = Math.max(...GROUPS.map(g => g.id)) + 1;
  store.set("jp_newGroup", { id, schedule: null, members: [] });
  joinGroup(id); return id;
}
const fmtSchedule = s => `${s.day}, ${s.date} · ${s.start}–${s.end} WIB`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = n => n.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

/* ----- Modal, dialog, toast ----- */
function openModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id)?.classList.add("hidden"); }
function showToast(msg) {
  const t = document.getElementById("toast"); if (!t) return;
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(showToast.t); showToast.t = setTimeout(() => t.classList.add("hidden"), 2800);
}
// Dialog serbaguna: cancel = null berarti hanya satu tombol (untuk pesan penolakan).
function dialog({ title, body, ok = "Ya, lanjutkan", cancel = "Batal", danger = false, onOk }) {
  document.getElementById("dlgTitle").textContent = title;
  document.getElementById("dlgBody").innerHTML = body;
  const okBtn = document.getElementById("dlgOk"), cancelBtn = document.getElementById("dlgCancel");
  okBtn.textContent = ok; okBtn.classList.toggle("danger", danger);
  cancelBtn.classList.toggle("hidden", cancel === null); if (cancel) cancelBtn.textContent = cancel;
  okBtn.onclick = () => { closeModal("dialogModal"); onOk && onOk(); };
  openModal("dialogModal");
}

/* ----- Profil mahasiswa ----- */
function profileView(msg = "") {
  const c = getCourse(), g = getMyGroup();
  // "l" = kolom kiri pasangan, "f" = satu baris penuh
  const rows = [["NPM", STUDENT.npm, "l"], ["Angkatan", STUDENT.angkatan, ""], ["Email", STUDENT.email, "f"],
    ["Program Studi", STUDENT.prodi, "l"], ["Tahun Akademik", STUDENT.tahun, ""], ["Mata Kuliah", `${c.name} (${c.short})`, "f"],
    ["Kelas", c.kelas, "l"], ["Kelompok", g ? `Kelompok ${g.id}` : "Belum bergabung", ""],
    ["Jadwal Presentasi", g ? (g.schedule ? `${fmtSchedule(g.schedule)}, ${g.schedule.room}` : "Belum ditetapkan Dosen") : "-", "f"]];
  return `<button class="modal-close" data-close="profileModal" aria-label="Tutup">×</button>
    <div class="pf-head"><span class="pf-ava">${initials(STUDENT.name)}</span><div><h2>${STUDENT.name}</h2><span class="status-pill">${STUDENT.status}</span></div></div>
    ${msg ? `<p class="form-msg ok">${msg}</p>` : ""}
    <div class="info-grid">${rows.map(r => `<div class="${r[2] === "f" ? "full" : r[2] === "l" ? "l" : ""}"><small>${r[0]}</small><b>${esc(r[1])}</b></div>`).join("")}</div>
    <div class="modal-actions"><button class="soft-btn" id="pfEdit">Ubah Mata Kuliah / Kelas</button><button class="primary-btn" data-close="profileModal">Tutup</button></div>`;
}
function profileForm(err = "") {
  const c = getCourse();
  return `<button class="modal-close" data-close="profileModal" aria-label="Tutup">×</button>
    <h2>Ubah Mata Kuliah / Kelas</h2>
    <div class="edit-form">
      <p class="hint">Hanya mata kuliah semester berjalan yang memiliki tugas besar yang ditampilkan.</p>
      <label>Mata kuliah<select id="pfCourse">${COURSES.map(x => `<option value="${x.short}" ${x.short === c.short ? "selected" : ""}>${x.name} (${x.short})</option>`).join("")}</select></label>
      <label>Kelas<select id="pfKelas"></select></label>
      ${getMyGroup() ? `<p class="hint warn">Jika mata kuliah atau kelas diganti, keanggotaan Anda di kelompok saat ini akan dilepas.</p>` : ""}
      ${err ? `<p class="form-msg err">${err}</p>` : ""}
    </div>
    <div class="modal-actions"><button class="soft-btn" id="pfCancel">Batal</button><button class="primary-btn" id="pfSave">Simpan</button></div>`;
}
function showProfile(msg = "") {
  document.getElementById("profileBody").innerHTML = profileView(msg);
  document.getElementById("pfEdit").onclick = () => showProfileForm();
  openModal("profileModal");
}
function showProfileForm(err = "") {
  document.getElementById("profileBody").innerHTML = profileForm(err);
  const course = document.getElementById("pfCourse"), kelas = document.getElementById("pfKelas");
  const fill = keep => { const cs = COURSES.find(x => x.short === course.value).classes;
    kelas.innerHTML = cs.map(k => `<option ${k === keep ? "selected" : ""}>${k}</option>`).join(""); };
  fill(getCourse().kelas); course.onchange = () => fill();
  document.getElementById("pfCancel").onclick = () => showProfile();
  document.getElementById("pfSave").onclick = () => {
    const cur = getCourse(), changed = course.value !== cur.short || kelas.value !== cur.kelas;
    if (changed && getMyGroup() && isLocked()) return showProfileForm("Jadwal sudah dikunci oleh Dosen, sehingga pilihan tidak dapat diubah.");
    store.set("jp_course", course.value); store.set("jp_kelas", kelas.value);
    if (changed && getMyGroup()) leaveGroup();
    refreshShell(); document.dispatchEvent(new CustomEvent("japres:change"));
    showProfile(`Pilihan tersimpan: ${course.value} – Kelas ${kelas.value}.`);
    showToast("Pilihan mata kuliah dan kelas tersimpan");
  };
}

/* ----- Sesi & logout ----- */
function checkSession() {
  const last = store.get("jp_last");
  if (last && Date.now() - last > SESSION_MS) { store.del("jp_last"); location.href = LOGIN_URL; return false; }
  store.set("jp_last", Date.now()); return true;
}
function logout() { store.del("jp_last"); location.href = LOGIN_URL; }

function refreshShell() {
  const c = getCourse(), el = document.getElementById("courseText");
  if (el) el.textContent = `Informatika UNPAR • Tahun Akademik ${STUDENT.tahun} • ${c.short} • Kelas ${c.kelas}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop hidden" id="dialogModal"><div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" data-close="dialogModal" aria-label="Tutup">×</button>
      <h2 id="dlgTitle"></h2><div class="dlg-body" id="dlgBody"></div>
      <div class="modal-actions"><button class="soft-btn" id="dlgCancel" data-close="dialogModal">Batal</button><button class="primary-btn" id="dlgOk"></button></div>
    </div></div>
    <div class="modal-backdrop hidden" id="profileModal"><div class="modal profile-modal" role="dialog" aria-modal="true" id="profileBody"></div></div>
    <div class="toast hidden" id="toast"></div>`);
  if (!checkSession()) return;
  refreshShell();
});

document.addEventListener("click", e => {
  checkSession();                                              // tes: klik menu setelah 30 menit -> kembali ke login
  const close = e.target.closest("[data-close]");
  if (close) closeModal(close.dataset.close);
  if (e.target.classList.contains("modal-backdrop")) e.target.classList.add("hidden");
  const act = e.target.closest("[data-action]")?.dataset.action;
  if (act === "profile") showProfile();
  if (act === "logout") dialog({ title: "Keluar dari JAPRES?", body: "<p>Anda akan kembali ke halaman login.</p>", ok: "Ya, keluar", danger: true, onOk: logout });
});
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden")); });
