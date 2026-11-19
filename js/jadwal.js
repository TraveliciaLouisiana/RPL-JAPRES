document.addEventListener("DOMContentLoaded", () => {
  // Klik kartu jadwal untuk melihat detail.
  document.querySelectorAll(".event").forEach(eventCard => {
    eventCard.addEventListener("click", () => {
      const data = eventCard.dataset;
      document.getElementById("modalTitle").textContent = data.title || "Detail Jadwal";
      document.getElementById("modalBody").innerHTML = `
        <p><strong>Hari:</strong> ${data.day || "-"}</p>
        <p><strong>Waktu:</strong> ${data.time || "-"}</p>
        <p><strong>Tanggal:</strong> ${data.date || "-"}</p>
        <p><strong>Tempat:</strong> ${data.place || "Sesuai jadwal perkuliahan"}</p>`;
      openModal("scheduleModal");
    });
  });

  document.getElementById("newScheduleBtn")?.addEventListener("click", () => openModal("newScheduleModal"));

  // Form contoh: jadwal baru ditambahkan ke kalender untuk sesi browser ini.
  document.getElementById("scheduleForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const dayIndex = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].indexOf(form.get("day"));
    const grid = document.getElementById("calendarGrid");
    const cells = [...grid.querySelectorAll(".calendar-cell")];
    // Grid memiliki 6 baris waktu, masing-masing 5 hari.
    const targetCell = cells[dayIndex];
    if (targetCell) {
      const card = document.createElement("button");
      card.className = "event presentation-event compact";
      card.innerHTML = `<small>JADWAL BARU</small><strong></strong>`;
      card.querySelector("strong").textContent = form.get("title");
      card.dataset.title = form.get("title");
      card.dataset.time = form.get("time");
      card.dataset.day = form.get("day");
      card.addEventListener("click", () => {
        document.getElementById("modalTitle").textContent = card.dataset.title;
        document.getElementById("modalBody").textContent = `${card.dataset.day} • ${card.dataset.time} • ${form.get("note") || "Tidak ada keterangan"}`;
        openModal("scheduleModal");
      });
      targetCell.appendChild(card);
    }
    closeModal("newScheduleModal");
    event.target.reset();
    alert("Jadwal berhasil ditambahkan pada tampilan kalender. Data contoh ini belum disimpan ke database.");
  });
});
