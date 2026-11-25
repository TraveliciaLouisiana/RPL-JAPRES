// Menu "Daftar Kuliah": mata kuliah yang Anda ambil di FRS dan memiliki tugas besar (data dari database).
async function render(ulang = false) {
  const err = document.getElementById("loadError"), rows = document.getElementById("courseRows");
  const ok = ulang ? await startApp() : await appReady;
  if (!ok) {                                       // gagal dimuat -> pesan + "Coba Lagi"
    rows.innerHTML = ""; err.classList.remove("hidden"); return;
  }
  err.classList.add("hidden");
  rows.innerHTML = COURSES.length
    ? COURSES.map(c => `<tr><td>${esc(c.kode)}</td><td><b>${esc(c.name)}</b> <span class="hint">(${esc(c.short)})</span></td><td>${c.sks}</td><td>Kelas ${esc(c.kelas)}</td></tr>`).join("")
    : `<tr><td colspan="4">Anda belum mengambil mata kuliah yang memiliki tugas besar.</td></tr>`;
}
document.addEventListener("DOMContentLoaded", () => { document.getElementById("retry").onclick = () => render(true); render(); });
