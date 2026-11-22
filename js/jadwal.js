const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const ROW_STARTS = [7, 8, 10, 12, 13, 15, 17].map(h => h * 60);   // jam mulai tiap baris kalender
const toMin = t => { const m = /(\d{1,2})[.:](\d{2})/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : null; };

// Mencari sel kalender berdasarkan hari dan jam mulai.
function cellFor(day, start) {
  const d = DAYS.indexOf(day), mins = toMin(start);
  if (d < 0 || mins === null) return null;
  let row = 0; ROW_STARTS.forEach((s, i) => { if (mins >= s) row = i; });
  return document.querySelectorAll("#calendarGrid .calendar-cell")[row * 5 + d] || null;
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

function addExtra(ev) {
  const cell = cellFor(ev.day, ev.time); if (!cell) return false;
  const card = document.createElement("button");
  card.className = "event extra-event";
  card.innerHTML = `<small>KEGIATAN TAMBAHAN</small><b></b><span></span>`;
  card.querySelector("b").textContent = ev.title; card.querySelector("span").textContent = ev.time;
  Object.assign(card.dataset, { title: ev.title, time: ev.time, day: ev.day, note: ev.note || "" });
  bindCard(card); cell.appendChild(card); return true;
}

// Menampilkan jadwal presentasi kelompok + bar informasinya (sudah / belum ditetapkan).
function renderPresentation() {
  document.querySelectorAll(".presentation-event").forEach(e => e.remove());
  document.querySelectorAll(".calendar-head[data-day]").forEach(h => { h.classList.remove("today"); h.querySelector(".head-note")?.remove(); });
  const c = getCourse(), g = getMyGroup(), s = g && g.schedule, info = document.getElementById("scheduleInfo");

  if (!g) {
    info.className = "info-bar warn";
    info.innerHTML = `<span>Anda belum bergabung dengan kelompok. Jadwal presentasi muncul setelah Dosen menetapkannya. <a href="kelompok.html">Buka Informasi Kelompok</a></span>`;
  } else if (!s) {
    info.className = "info-bar warn";
    info.innerHTML = `<span><b>Jadwal presentasi belum tersedia.</b> Dosen belum menetapkan jadwal untuk Kelompok ${g.id}.</span>`;
  } else {
    info.className = "info-bar notice";
    info.innerHTML = [["Presentasi", `Kelompok ${g.id}`], ["Hari", s.day], ["Tanggal", s.date], ["Jam", `${s.start}–${s.end} WIB`], ["Ruangan", `${s.room} ${s.building}`]]
      .map(x => `<div class="seg"><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join("");
    const cell = cellFor(s.day, s.start);
    if (cell) {
      const card = document.createElement("button");
      card.className = "event presentation-event";
      card.innerHTML = `<div class="event-top"><span class="event-badge">PRESENTASI</span><span class="event-time">${s.start}–${s.end}</span></div>
        <strong class="event-title">${c.short} Presentasi Kelompok ${g.id}</strong><span class="event-place">${esc(s.room)} · ${s.mode}</span>`;
      Object.assign(card.dataset, { kind: "presentation", title: `${c.short} Presentasi Kelompok ${g.id}`, day: s.day, date: s.date,
        time: `${s.start}–${s.end} WIB`, place: `${s.room} ${s.building}`, note: s.mode });
      bindCard(card); cell.prepend(card);
    }
    const head = document.querySelector(`.calendar-head[data-day="${s.day}"]`);
    if (head) { head.classList.add("today"); head.insertAdjacentHTML("beforeend", `<small class="head-note">Hari Presentasi</small>`); }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".class-event").forEach(bindCard);
  store.get("jp_events", []).forEach(addExtra);
  renderPresentation();
  document.addEventListener("japres:change", renderPresentation);

  document.getElementById("newScheduleBtn").addEventListener("click", () => openModal("newScheduleModal"));
  document.getElementById("scheduleForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), ev = { title: f.title.trim(), day: f.day, time: f.time.trim(), note: f.note.trim() };
    if (!addExtra(ev)) return showToast("Format waktu tidak valid. Contoh: 10:30–11:00");
    store.set("jp_events", [...store.get("jp_events", []), ev]);
    closeModal("newScheduleModal"); e.target.reset(); showToast("Kegiatan ditambahkan ke kalender");
  });
});
