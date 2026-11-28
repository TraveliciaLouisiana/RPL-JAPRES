/* =====================================================================
   jadwal.js  —  Halaman "Jadwal Perkuliahan"

   Cara kerja kalender (berbeda dari versi lama):
   - Sumbu waktu dibuat per 1 JAM (07.00, 08.00, 09.00, ...), bukan per 2 jam lagi.
   - Setiap kartu diposisikan berdasarkan jam_mulai & jam_selesai dari DATABASE sampai ke menit.
       top    = (jam_mulai   - jam awal kalender) x tinggi 1 jam
       height = (jam_selesai - jam_mulai)         x tinggi 1 jam
     Contoh: 14:50-16:30 akan mulai di 2/3 antara garis 14.00 dan 15.00 lalu berakhir di 16:30.
   - Kartu yang waktunya bertabrakan di hari yang sama dibagi berdampingan (kiri-kanan).
   - Setiap mata kuliah otomatis mendapat warna sendiri (lihat warnaMataKuliah).
   ===================================================================== */

const FILTER = { class: true, presentation: true, extra: true, free: true };   // jenis jadwal yang sedang ditampilkan
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/* ----- Pengaturan kalender (ubah di sini bila perlu) ----- */
const HOUR_PX = 72;          // tinggi 1 jam dalam piksel (harus nyaman dibaca: kartu 100 menit = 120px)
let START_H = 7;             // jam awal kalender (07.00)
let END_H = 18;              // jam akhir kalender (18.00). Otomatis melebar bila ada jadwal di luar rentang ini.
const MIN_CARD_PX = 34;      // tinggi minimal kartu (supaya presentasi 20 menit tetap terbaca & bisa diklik)
const COMPACT_PX = 56;       // kartu yang lebih pendek dari ini ditampilkan 1 baris saja
const PALETTE_COUNT = 10;    // jumlah warna pada jadwal.css (.subject-color-0 ... .subject-color-9)
const PATTERN_COUNT = 4;     // jumlah motif pada jadwal.css (.pattern-0 ... .pattern-3)

const EVENTS = [];           // semua kartu di kalender: { kind, day, start, end, el }

/* ----- Fungsi bantu waktu ----- */
const toMin = t => { const m = /(\d{1,2})[.:](\d{2})/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : null; };
const pad = n => String(n).padStart(2, "0");
const fmtMin = (min, sep = ":") => `${pad(Math.floor(min / 60))}${sep}${pad(min % 60)}`;

/* ----- Sumbu waktu (kolom jam di kiri) ----- */
function buildTimeAxis() {
  const cal = document.getElementById("calendar");
  cal.style.setProperty("--hour", HOUR_PX + "px");           // tinggi 1 jam -> dipakai jadwal.css
  cal.style.setProperty("--hours", END_H - START_H);         // jumlah jam yang tampil
  const col = document.getElementById("timeCol");
  col.innerHTML = "";
  for (let h = START_H; h < END_H; h++) {                    // satu label per jam: 07.00, 08.00, 09.00, ...
    const l = document.createElement("div");
    l.className = "time-label"; l.textContent = `${pad(h)}.00`;
    col.appendChild(l);
  }
}

// Melebarkan kalender otomatis jika ada jadwal yang jamnya di luar rentang awal (supaya tidak ada jadwal yang hilang).
function ensureRange(startMin, endMin) {
  const s = Math.min(START_H, Math.floor(startMin / 60)), e = Math.max(END_H, Math.ceil(endMin / 60));
  if (s !== START_H || e !== END_H) { START_H = s; END_H = Math.min(e, 24); buildTimeAxis(); }
}

/* ----- Warna per mata kuliah -----
   Nama mata kuliah diurutkan abjad lalu diberi warna + motif berurutan. Kombinasi warna & motif
   dijamin berbeda untuk tiap mata kuliah (sampai 20 mata kuliah), dan mata kuliah yang sama selalu sama. */
const WARNA = {};
function susunWarna(daftarJadwal) {
  [...new Set(daftarJadwal.map(j => j.mataKuliah))].sort()
    .forEach((nama, i) => { WARNA[nama] = `subject-color-${i % PALETTE_COUNT} pattern-${i % PATTERN_COUNT}`; });
}
const warnaMataKuliah = nama => WARNA[nama] || "subject-color-0 pattern-0";   // isinya 2 class dipisah spasi

/* ----- Membuat kartu & menaruhnya di kalender ----- */
// Kerangka isi kartu: jam, judul, tempat, keterangan. Memakai textContent agar aman dari karakter HTML.
function makeCard({ time, title, place, sub, badge }) {
  const card = document.createElement("button");
  card.type = "button";
  const rows = [["ev-time", time], ["ev-title", title], ["ev-place", place], ["ev-sub", sub]];
  if (badge) rows.unshift(["ev-badge", badge]);
  rows.forEach(([cls, txt]) => {
    if (!txt) return;
    const d = document.createElement("div"); d.className = cls; d.textContent = txt; card.appendChild(d);
  });
  return card;
}

function addEvent(kind, day, startMin, endMin, card) {
  const col = document.querySelector(`.day-col[data-day="${day}"]`);
  if (!col || startMin === null || endMin === null || endMin <= startMin) return false;
  ensureRange(startMin, endMin);
  card.classList.add("event", `${kind}-event`);
  card.addEventListener("click", () => showDetail(card));
  col.appendChild(card);
  EVENTS.push({ kind, day, start: startMin, end: endMin, el: card });
  return true;
}

/* ----- Tata letak: posisi vertikal (dari jam) + pembagian kolom bila bertabrakan ----- */
function layoutAll() {
  DAYS.forEach(day => {
    // hanya kartu yang sedang tampil (sesuai filter) yang ikut ditata
    const list = EVENTS.filter(e => e.day === day && FILTER[e.kind]).sort((a, b) => a.start - b.start || b.end - a.end);

    // 1) kelompokkan kartu yang saling tumpang tindih (cluster)
    const clusters = []; let cur = [], curEnd = -1;
    list.forEach(e => {
      if (cur.length && e.start >= curEnd) { clusters.push(cur); cur = []; curEnd = -1; }
      cur.push(e); curEnd = Math.max(curEnd, e.end);
    });
    if (cur.length) clusters.push(cur);

    // 2) di tiap cluster, beri nomor kolom: kartu menempati kolom pertama yang sudah kosong
    clusters.forEach(cl => {
      const colEnds = [];
      cl.forEach(e => {
        let i = colEnds.findIndex(end => end <= e.start);
        if (i < 0) { i = colEnds.length; colEnds.push(0); }
        colEnds[i] = e.end; e.col = i;
      });
      cl.forEach(e => { e.cols = colEnds.length; });
    });

    // 3) terapkan ke CSS
    list.forEach(e => {
      const top = (e.start - START_H * 60) / 60 * HOUR_PX;
      const h = Math.max((e.end - e.start) / 60 * HOUR_PX, MIN_CARD_PX);
      const w = 100 / e.cols;
      Object.assign(e.el.style, {
        top: `${top + 1}px`, height: `${h - 2}px`,
        left: `calc(${w * e.col}% + 2px)`, width: `calc(${w}% - 4px)`
      });
      e.el.classList.toggle("compact", h < COMPACT_PX);
    });
  });
}

/* ----- Header tanggal ----- */
// Mengisi tanggal di header kalender (Senin–Jumat) untuk pekan yang memuat tanggal acuan (format "2026-12-16").
function setWeekHeaders(iso) {
  const ref = iso ? new Date(iso + "T00:00:00") : new Date();
  const monday = new Date(ref); monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
  DAYS.forEach((d, i) => {
    const dt = new Date(monday); dt.setDate(monday.getDate() + i);
    const small = document.querySelector(`.calendar-head[data-day="${d}"] small:not(.head-note)`);
    if (small) small.textContent = `${dt.getDate()} ${BULAN_PANJANG[dt.getMonth()]}`;
  });
}

/* ----- Popup detail ----- */
function showDetail(card) {
  const d = card.dataset;
  document.getElementById("modalTitle").textContent = d.title || "Detail Jadwal";
  const rows = [["Hari", d.day], ["Tanggal", d.date], ["Waktu", d.time], ["Tempat", d.place || "Sesuai jadwal perkuliahan"], ["Keterangan", d.note]]
    .filter(r => r[1]).map(r => `<p><strong>${r[0]}:</strong> ${esc(r[1])}</p>`).join("");
  document.getElementById("modalBody").innerHTML = rows +
    (d.kind === "presentation" ? `<p class="modal-note">Jadwal presentasi ditetapkan oleh Dosen. Mahasiswa hanya dapat melihat dan tidak dapat mengubah atau memindahkannya.</p>` : "");
  openModal("scheduleModal");
}

/* ----- Jadwal kuliah dari database (tabel jadwal_kuliah untuk kelas-kelas di FRS mahasiswa) ----- */
function addClass(j) {
  const s = toMin(j.mulai), e = toMin(j.selesai);
  const card = makeCard({
    time: `${j.mulai}–${j.selesai}`,                 // jam persis dari database
    title: j.mataKuliah,
    place: `Ruang ${j.ruangan}`,
    sub: `Kelas ${j.kelas} · ${j.dosen}`
  });
  card.classList.add("class-event", ...warnaMataKuliah(j.mataKuliah).split(" "));   // warna + motif sesuai mata kuliah
  Object.assign(card.dataset, {
    kind: "class", title: j.mataKuliah, time: `${j.mulai}–${j.selesai}`, day: j.hari,
    place: `Ruang ${j.ruangan}`, note: `Kelas ${j.kelas} · Dosen: ${j.dosen}`
  });
  return addEvent("class", j.hari, s, e, card);
}

/* ----- Kegiatan tambahan pribadi (disimpan di browser) ----- */
function addExtra(ev) {
  const m = /(\d{1,2}[.:]\d{2})\s*[–\-]\s*(\d{1,2}[.:]\d{2})/.exec(ev.time || "");   // "10:30–11:00" -> mulai & selesai
  if (!m) return false;
  const s = toMin(m[1]), e = toMin(m[2]);
  const card = makeCard({ time: ev.time, title: ev.title, sub: ev.note });
  Object.assign(card.dataset, { kind: "extra", title: ev.title, time: ev.time, day: ev.day, note: ev.note || "" });
  return addEvent("extra", ev.day, s, e, card);
}

/* ----- Filter ----- */
// Sembunyikan jenis jadwal yang tidak dicentang, lalu tata ulang sisanya.
function applyFilter() {
  const toggle = (sel, on) => document.querySelectorAll(sel).forEach(e => e.classList.toggle("hidden", !on));
  toggle(".class-event", FILTER.class); toggle(".presentation-event", FILTER.presentation); toggle(".extra-event", FILTER.extra);
  document.querySelectorAll(".calendar-head[data-day]").forEach(h => {          // sorotan "Hari Presentasi" ikut filter
    h.classList.toggle("today", FILTER.presentation && !!h.querySelector(".head-note"));
    h.querySelector(".head-note")?.classList.toggle("hidden", !FILTER.presentation);
  });
  // "Slot Kosong": area tanpa kartu diberi warna biru muda
  document.querySelectorAll(".day-col").forEach(c => c.classList.toggle("free", FILTER.free));
  document.getElementById("resetFilter").classList.toggle("hidden", Object.values(FILTER).every(Boolean));
  layoutAll();
}

/* ----- Jadwal presentasi kelompok + bar informasinya (sudah / belum ditetapkan) ----- */
function renderPresentation() {
  // buang kartu presentasi lama (bila ganti mata kuliah) dari layar maupun dari daftar EVENTS
  document.querySelectorAll(".presentation-event").forEach(e => e.remove());
  for (let i = EVENTS.length - 1; i >= 0; i--) if (EVENTS[i].kind === "presentation") EVENTS.splice(i, 1);
  document.querySelectorAll(".calendar-head[data-day]").forEach(h => { h.classList.remove("today"); h.querySelector(".head-note")?.remove(); });

  const c = getCourse(), g = getMyGroup(), s = g && g.schedule, info = document.getElementById("scheduleInfo");
  setWeekHeaders(s ? s.iso : null);                // kalender menampilkan pekan presentasi (atau pekan ini bila belum ada)

  if (!g) {
    info.className = "info-bar warn";
    info.innerHTML = `<span>Anda belum bergabung dengan kelompok. Jadwal presentasi muncul setelah Dosen menetapkannya. <a href="kelompok.html">Buka Informasi Kelompok</a></span>`;
  } else if (!s) {
    info.className = "info-bar warn";
    // Sebelum dikunci Dosen: jadwal memang belum boleh tampil. Setelah dikunci: menunggu Dosen menetapkan jadwal.
    info.innerHTML = isLocked()
      ? `<span><b>Jadwal presentasi belum tersedia.</b> Kelompok sudah dikunci, Dosen belum menetapkan jadwal untuk Kelompok ${esc(g.nomor)}.</span>`
      : `<span><b>Jadwal presentasi belum tersedia.</b> Jadwal diumumkan setelah Dosen mengunci kelompok dan menetapkan jadwalnya. Anda saat ini di Kelompok ${esc(g.nomor)}.</span>`;
  } else {
    info.className = "info-bar notice";
    info.innerHTML = [["Presentasi", `Kelompok ${g.nomor}`], ["Hari", s.day], ["Tanggal", s.date], ["Jam", `${s.start}–${s.end} WIB`], ["Ruangan", s.room]]
      .map(x => `<div class="seg"><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join("");

    const judul = `${c.short} Presentasi Kelompok ${g.nomor}`;
    const card = makeCard({ badge: "PRESENTASI", time: `${s.start}–${s.end}`, title: judul, place: `Ruang ${s.room}` });
    Object.assign(card.dataset, {
      kind: "presentation", title: judul, day: s.day, date: s.date,
      time: `${s.start}–${s.end} WIB`, place: `Ruang ${s.room}`, note: ""
    });
    addEvent("presentation", s.day, toMin(s.start), toMin(s.end), card);

    const head = document.querySelector(`.calendar-head[data-day="${s.day}"]`);
    if (head) { head.classList.add("today"); head.insertAdjacentHTML("beforeend", `<small class="head-note">Hari Presentasi</small>`); }
  }
  applyFilter();
}

const syncChips = () => document.querySelectorAll("#filters .filter-chip").forEach(l => l.classList.toggle("off", !l.querySelector("input").checked));

document.addEventListener("DOMContentLoaded", async () => {
  buildTimeAxis();                                  // gambar label jam 07.00, 08.00, ... dulu

  // Filter & tombol-tombol tidak butuh data, jadi dipasang dulu.
  document.querySelectorAll("#filters input").forEach(i => i.addEventListener("change", () => { FILTER[i.dataset.filter] = i.checked; syncChips(); applyFilter(); }));
  document.getElementById("resetFilter").addEventListener("click", () => {
    Object.keys(FILTER).forEach(k => FILTER[k] = true); document.querySelectorAll("#filters input").forEach(i => i.checked = true); syncChips(); applyFilter();
  });
  document.getElementById("newScheduleBtn").addEventListener("click", () => openModal("newScheduleModal"));
  document.getElementById("scheduleForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), ev = { title: f.title.trim(), day: f.day, time: f.time.trim(), note: f.note.trim() };
    if (!addExtra(ev)) return showToast("Waktu tidak valid. Contoh: 10:30–11:00 (jam selesai harus setelah jam mulai)");
    store.set(userKey("jp_events"), [...store.get(userKey("jp_events"), []), ev]);
    FILTER.extra = true; document.querySelector('[data-filter="extra"]').checked = true; syncChips(); applyFilter();   // kegiatan baru langsung terlihat
    closeModal("newScheduleModal"); e.target.reset(); showToast("Kegiatan ditambahkan ke kalender");
  });

  // Data dari database
  if (!(await appReady)) return;
  try {
    const jadwal = await api("/portal/jadwal-kuliah");
    susunWarna(jadwal);                             // tentukan warna tiap mata kuliah SEBELUM kartu dibuat
    jadwal.forEach(addClass);
  } catch (e) { showToast(e.message); }
  store.get(userKey("jp_events"), []).forEach(addExtra);      // kegiatan tambahan pribadi: masih disimpan di browser (belum ada tabelnya)
  renderPresentation();
  document.addEventListener("japres:change", renderPresentation);
});
