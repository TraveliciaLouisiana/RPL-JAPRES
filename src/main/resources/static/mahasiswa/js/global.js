/* ===== JAPRES: data & fungsi bersama (terhubung ke database lewat API) ===== */
const LOGIN_URL = "login.html";          // halaman login (satu folder dengan halaman lain)
const SESSION_MS = 30 * 60 * 1000;       // sesi berakhir setelah 30 menit tanpa aktivitas

// Data ini TIDAK lagi ditulis manual; semuanya diisi dari database oleh initApp() / loadGroups().
let STUDENT = null;      // dari GET /api/portal/profil
let COURSES = [];        // dari GET /api/portal/mata-kuliah (FRS mahasiswa yang punya tugas besar)
let GROUP_DATA = null;   // dari GET /api/portal/kelompok?kode=... (untuk mata kuliah yang sedang dipilih)
let appReady = null;     // Promise<boolean>; halaman menunggu ini sebelum menggambar tampilan

/* ----- Penyimpanan sederhana (localStorage) — hanya untuk preferensi tampilan ----- */
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

// Preferensi tampilan disimpan per NPM, supaya akun lain di browser yang sama tidak mewarisi pilihan akun sebelumnya.
const userKey = k => `${k}:${STUDENT ? STUDENT.npm : ""}`;

/* ----- Memuat data dari server ----- */
async function loadGroups() {
  const c = getCourse();
  GROUP_DATA = c.kode ? await api("/portal/kelompok?kode=" + encodeURIComponent(c.kode)) : null;
}

async function initApp() {
  try {
    const me = await api("/auth/me");                                   // cek sesi login di server
    if (me.role !== "mahasiswa") { location.href = LOGIN_URL; return false; }
    const [profil, mk] = await Promise.all([api("/portal/profil"), api("/portal/mata-kuliah")]);
    COURSES = mk.map(m => ({ short: m.singkatan, kode: m.kode, name: m.nama, sks: m.sks, kelas: m.kelas,
      semester: m.semester, idTugasBesar: m.idTugasBesar, kuota: m.kuota, durasi: m.durasi }));
    STUDENT = { name: profil.nama, npm: profil.npm, email: profil.email, prodi: profil.prodi, angkatan: profil.angkatan,
      status: profil.status, tahun: ((COURSES[0] && COURSES[0].semester) || "").replace(/^\S+\s*/, "") || "-" };
    await loadGroups();
    return true;
  } catch (e) {
    if (e.status === 401 || e.status === 403) { location.href = LOGIN_URL; return false; }
    showToast(e.message);
    return false;
  }
}

function startApp() {
  appReady = initApp().then(ok => {
    if (ok) {
      refreshShell();
      document.querySelectorAll(".profile-btn .who strong").forEach(el => el.textContent = STUDENT.name);
    }
    return ok;
  });
  return appReady;
}

/* ----- Status mahasiswa (dibaca dari data yang sudah dimuat) ----- */
const NO_COURSE = { short: "-", kode: null, name: "Belum ada mata kuliah", sks: 0, kelas: "-" };
const isLocked = () => !!(GROUP_DATA && GROUP_DATA.dikunci);
const maxMembers = () => (GROUP_DATA ? GROUP_DATA.kuota : 0);
const getCourse = () => COURSES.find(c => c.short === store.get(userKey("jp_course"))) || COURSES[0] || NO_COURSE;

// Mengubah bentuk data API menjadi bentuk yang dipakai tampilan (id = id_kelompok, nomor = "1", "2", ...).
const toGroup = k => ({
  id: k.id, nomor: k.nomor,
  schedule: k.jadwal ? { day: k.jadwal.hari, date: k.jadwal.tanggal, iso: k.jadwal.tanggalIso,
    start: k.jadwal.mulai, end: k.jadwal.selesai, room: k.jadwal.ruangan } : null,
  members: k.anggota.map(a => ({ name: a.nama, npm: a.npm, me: a.npm === STUDENT.npm }))
});
const allGroups = () => (GROUP_DATA ? GROUP_DATA.kelompok.map(toGroup) : []);
const getMyGroupId = () => (GROUP_DATA && GROUP_DATA.idKelompokSaya) || null;
const getMyGroup = () => allGroups().find(g => g.id === getMyGroupId()) || null;
const membersOf = g => g.members;

async function joinGroup(id) {
  await api(`/portal/kelompok/${encodeURIComponent(id)}/gabung`, { method: "POST" });
  await loadGroups();
}
async function leaveGroup() {
  await api(`/portal/kelompok/${encodeURIComponent(getMyGroupId())}/anggota-saya`, { method: "DELETE" });
  await loadGroups();
}
async function createGroup() {
  const r = await api("/portal/kelompok", { method: "POST", body: { kodeMk: getCourse().kode } });
  await loadGroups();
  return r.nomor;
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
    ["Kelas", c.kelas, "l"], ["Kelompok", g ? `Kelompok ${g.nomor}` : "Belum bergabung", ""],
    ["Jadwal Presentasi", g ? (g.schedule ? `${fmtSchedule(g.schedule)}, Ruang ${g.schedule.room}` : "Belum ditetapkan Dosen") : "-", "f"]];
  return `<button class="modal-close" data-close="profileModal" aria-label="Tutup">×</button>
    <div class="pf-head"><span class="pf-ava">${esc(initials(STUDENT.name))}</span><div><h2>${esc(STUDENT.name)}</h2><span class="status-pill">${esc(STUDENT.status)}</span></div></div>
    ${msg ? `<p class="form-msg ok">${esc(msg)}</p>` : ""}
    <div class="info-grid">${rows.map(r => `<div class="${r[2] === "f" ? "full" : r[2] === "l" ? "l" : ""}"><small>${r[0]}</small><b>${esc(r[1])}</b></div>`).join("")}</div>
    <div class="modal-actions"><button class="soft-btn" id="pfEdit">Ganti Mata Kuliah</button><button class="primary-btn" data-close="profileModal">Tutup</button></div>`;
}
function profileForm(err = "") {
  const c = getCourse();
  return `<button class="modal-close" data-close="profileModal" aria-label="Tutup">×</button>
    <h2>Ganti Mata Kuliah</h2>
    <div class="edit-form">
      <p class="hint">Hanya mata kuliah yang Anda ambil di FRS dan memiliki tugas besar yang ditampilkan. Kelas ditentukan oleh FRS.</p>
      <label>Mata kuliah<select id="pfCourse">${COURSES.map(x => `<option value="${esc(x.short)}" ${x.short === c.short ? "selected" : ""}>${esc(x.name)} (${esc(x.short)})</option>`).join("")}</select></label>
      <label>Kelas<select id="pfKelas" disabled></select></label>
      ${err ? `<p class="form-msg err">${esc(err)}</p>` : ""}
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
  const fill = () => { const x = COURSES.find(k => k.short === course.value); kelas.innerHTML = `<option>${esc(x ? x.kelas : "-")}</option>`; };
  fill(); course.onchange = fill;
  document.getElementById("pfCancel").onclick = () => showProfile();
  document.getElementById("pfSave").onclick = async () => {
    const cur = getCourse();
    if (course.value === cur.short) return showProfile();
    store.set(userKey("jp_course"), course.value);
    try { await loadGroups(); }
    catch (e) { store.set(userKey("jp_course"), cur.short); return showProfileForm(e.message); }
    refreshShell(); document.dispatchEvent(new CustomEvent("japres:change"));
    showProfile(`Mata kuliah aktif: ${getCourse().short} – Kelas ${getCourse().kelas}.`);
    showToast("Mata kuliah diganti");
  };
}

/* ----- Sesi & logout ----- */
function checkSession() {
  const last = store.get("jp_last");
  if (last && Date.now() - last > SESSION_MS) { store.del("jp_last"); location.href = LOGIN_URL; return false; }
  store.set("jp_last", Date.now()); return true;
}
async function logout() {
  store.del("jp_last");
  try { await api("/auth/logout", { method: "POST" }); } catch {}      // hapus sesi di server
  location.href = LOGIN_URL;
}

function refreshShell() {
  if (!STUDENT) return;
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
  startApp();
});

document.addEventListener("click", e => {
  checkSession();                                              // tes: klik menu setelah 30 menit -> kembali ke login
  const close = e.target.closest("[data-close]");
  if (close) closeModal(close.dataset.close);
  if (e.target.classList.contains("modal-backdrop")) e.target.classList.add("hidden");
  const act = e.target.closest("[data-action]")?.dataset.action;
  if (act === "profile" && STUDENT) showProfile();
  if (act === "logout") dialog({ title: "Keluar dari JAPRES?", body: "<p>Anda akan kembali ke halaman login.</p>", ok: "Ya, keluar", danger: true, onOk: logout });
});
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.add("hidden")); });
