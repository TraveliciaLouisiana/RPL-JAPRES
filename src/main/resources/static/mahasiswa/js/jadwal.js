const FILTER = { class: true, presentation: true, extra: true, free: true };   // jenis jadwal yang sedang ditampilkan
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const ROW_STARTS = [7, 8, 10, 12, 13, 15, 17].map(h => h * 60);   // jam mulai tiap baris kalender
const toMin = t => { const m = /(\d{1,2})[.:](\d{2})/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : null; };

// Mencari sel kalender berdasarkan hari dan jam mulai.
function cellFor(day, start) {
  const d = DAYS.indexOf(day), mins = toMin(start);
  if (d < 0 || mins === null) return null;
  let row = 0; ROW_STARTS.forEach((s, i) => { if (mins >= s) row = i; });
  return document.querySelectorAll("#calendarGrid .calendar-cell")[row * 5 + d] || null;
}

// Mengisi tanggal di header kalender (Senin–Jumat) untuk pekan yang memuat tanggal acuan (format "2026-12-16").
function setWeekHeaders(iso) {
  const ref = iso ? new Date(iso + "T00:00:00") : new Date();
  const monday = new Date(ref); monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
  const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
  DAYS.forEach((d, i) => {
    const dt = new Date(monday); dt.setDate(monday.getDate() + i);
    const small = document.querySelector(`.calendar-head[data-day="${d}"] small:not(.head-note)`);
    if (small) small.textContent = `${dt.getDate()} ${BULAN_PANJANG[dt.getMonth()]}`;
  });
  const th = document.querySelector(".time-head small");
  if (th) th.textContent = `${monday.getDate()}–${friday.getDate()} ${BULAN_PENDEK[friday.getMonth()]} ${friday.getFullYear()}`;
}

function showDetail(card) {
  const d = card.dataset;
  document.getElementById("modalTitle").textContent = d.title || "Detail Jadwal";
  const rows = [["Hari", d.day], ["Tanggal", d.date], ["Waktu", d.time], ["Tempat", d.place || "Sesuai jadwal perkuliahan"], ["Keterangan", d.note]]
    .filter(r => r[1]).map(r => `<p><strong>${r[0]}:</strong> ${esc(r[1])}</p>`).join("");
  document.getElementById("modalBody").innerHTML = rows +
    (d.kind === "presentation" ? `<p class="modal-note">Jadwal presentasi ditetapkan oleh Dosen. Mahasiswa hanya dapat melihat dan tidak dapat mengubah atau memindahkannya.</p>` : "");
  openModal("scheduleModal");
}
const bindCard = card => card.addEventListener("click", () => showDetail(card));

// Jadwal kuliah dari database (tabel jadwal_kuliah untuk kelas-kelas di FRS mahasiswa).
function addClass(j) {
  const cell = cellFor(j.hari, j.mulai); if (!cell) return false;
  const card = document.createElement("button");
  card.className = "event class-event";
  card.innerHTML = `<small>JADWAL MATA KULIAH</small><b></b><span></span><small></small>`;
  card.children[1].textContent = j.mataKuliah;
  card.children[2].textContent = `Kelas ${j.kelas} · Ruang ${j.ruangan}`;
  card.children[3].textContent = `${j.mulai}–${j.selesai} · ${j.dosen}`;
  Object.assign(card.dataset, { title: j.mataKuliah, time: `${j.mulai}–${j.selesai}`, day: j.hari,
    place: `Ruang ${j.ruangan}`, note: `Kelas ${j.kelas} · Dosen: ${j.dosen}` });
  bindCard(card); cell.appendChild(card); return true;
}

function addExtra(ev) {
  const cell = cellFor(ev.day, ev.time); if (!cell) return false;
  const card = document.createElement("button");
  card.className = "event extra-event";
  card.innerHTML = `<small>KEGIATAN TAMBAHAN</small><b></b><span></span>`;
  card.querySelector("b").textContent = ev.title; card.querySelector("span").textContent = ev.time;
  Object.assign(card.dataset, { title: ev.title, time: ev.time, day: ev.day, note: ev.note || "" });
  bindCard(card); cell.appendChild(card); return true;
}

// Menerapkan filter: sembunyikan jenis jadwal yang tidak dicentang, tandai sel kosong bila "Slot Kosong" dicentang
function applyFilter() {
  const toggle = (sel, on) => document.querySelectorAll(sel).forEach(e => e.classList.toggle("hidden", !on));
  toggle(".class-event", FILTER.class); toggle(".presentation-event", FILTER.presentation); toggle(".extra-event", FILTER.extra);
  document.querySelectorAll(".calendar-head[data-day]").forEach(h => {          // sorotan "Hari Presentasi" ikut filter
    h.classList.toggle("today", FILTER.presentation && !!h.querySelector(".head-note"));
    h.querySelector(".head-note")?.classList.toggle("hidden", !FILTER.presentation);
  });
  document.querySelectorAll("#calendarGrid .calendar-cell").forEach(c => c.classList.toggle("free", FILTER.free && !c.querySelector(".event")));
  document.getElementById("resetFilter").classList.toggle("hidden", Object.values(FILTER).every(Boolean));
}

// Menampilkan jadwal presentasi kelompok + bar informasinya (sudah / belum ditetapkan).
function renderPresentation() {
  document.querySelectorAll(".presentation-event").forEach(e => e.remove());
  document.querySelectorAll(".calendar-head[data-day]").forEach(h => { h.classList.remove("today"); h.querySelector(".head-note")?.remove(); });
  const c = getCourse(), g = getMyGroup(), s = g && g.schedule, info = document.getElementById("scheduleInfo");
  setWeekHeaders(s ? s.iso : null);                // kalender menampilkan pekan presentasi (atau pekan ini bila belum ada)

  if (!g) {
    info.className = "info-bar warn";
    info.innerHTML = `<span>Anda belum bergabung dengan kelompok. Jadwal presentasi muncul setelah Dosen menetapkannya. <a href="kelompok.html">Buka Informasi Kelompok</a></span>`;
  } else if (!s) {
    info.className = "info-bar warn";
    info.innerHTML = `<span><b>Jadwal presentasi belum tersedia.</b> Dosen belum menetapkan jadwal untuk Kelompok ${esc(g.nomor)}.</span>`;
  } else {
    info.className = "info-bar notice";
    info.innerHTML = [["Presentasi", `Kelompok ${g.nomor}`], ["Hari", s.day], ["Tanggal", s.date], ["Jam", `${s.start}–${s.end} WIB`], ["Ruangan", s.room]]
      .map(x => `<div class="seg"><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join("");
    const cell = cellFor(s.day, s.start);
    if (cell) {
      const card = document.createElement("button");
      card.className = "event presentation-event";
      card.innerHTML = `<div class="event-top"><span class="event-badge">PRESENTASI</span><span class="event-time">${esc(s.start)}–${esc(s.end)}</span></div>
        <strong class="event-title">${esc(c.short)} Presentasi Kelompok ${esc(g.nomor)}</strong><span class="event-place">Ruang ${esc(s.room)}</span>`;
      Object.assign(card.dataset, { kind: "presentation", title: `${c.short} Presentasi Kelompok ${g.nomor}`, day: s.day, date: s.date,
        time: `${s.start}–${s.end} WIB`, place: `Ruang ${s.room}`, note: "" });
      bindCard(card); cell.prepend(card);
    }
    const head = document.querySelector(`.calendar-head[data-day="${s.day}"]`);
    if (head) { head.classList.add("today"); head.insertAdjacentHTML("beforeend", `<small class="head-note">Hari Presentasi</small>`); }
  }
  applyFilter();
}

const syncChips = () => document.querySelectorAll("#filters .filter-chip").forEach(l => l.classList.toggle("off", !l.querySelector("input").checked));

document.addEventListener("DOMContentLoaded", async () => {
  // Filter & tombol-tombol tidak butuh data, jadi dipasang dulu.
  document.querySelectorAll("#filters input").forEach(i => i.addEventListener("change", () => { FILTER[i.dataset.filter] = i.checked; syncChips(); applyFilter(); }));
  document.getElementById("resetFilter").addEventListener("click", () => {
    Object.keys(FILTER).forEach(k => FILTER[k] = true); document.querySelectorAll("#filters input").forEach(i => i.checked = true); syncChips(); applyFilter();
  });
  document.getElementById("newScheduleBtn").addEventListener("click", () => openModal("newScheduleModal"));
  document.getElementById("scheduleForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), ev = { title: f.title.trim(), day: f.day, time: f.time.trim(), note: f.note.trim() };
    if (!addExtra(ev)) return showToast("Format waktu tidak valid. Contoh: 10:30–11:00");
    store.set(userKey("jp_events"), [...store.get(userKey("jp_events"), []), ev]);
    FILTER.extra = true; document.querySelector('[data-filter="extra"]').checked = true; syncChips(); applyFilter();   // kegiatan baru langsung terlihat
    closeModal("newScheduleModal"); e.target.reset(); showToast("Kegiatan ditambahkan ke kalender");
  });

  // Data dari database
  if (!(await appReady)) return;
  try {
    (await api("/portal/jadwal-kuliah")).forEach(addClass);
  } catch (e) { showToast(e.message); }
  store.get(userKey("jp_events"), []).forEach(addExtra);      // kegiatan tambahan pribadi: masih disimpan di browser (belum ada tabelnya)
  renderPresentation();
  document.addEventListener("japres:change", renderPresentation);
});
