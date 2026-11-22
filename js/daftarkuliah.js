// Menu "Daftar Kuliah": hanya mata kuliah semester berjalan yang memiliki tugas besar.
function render() {
  const err = document.getElementById("loadError"), rows = document.getElementById("courseRows");
  try {
    rows.innerHTML = COURSES.map(c => `<tr><td>${c.kode}</td><td><b>${esc(c.name)}</b> <span class="hint">(${c.short})</span></td><td>${c.sks}</td><td>${c.classes.map(k => "Kelas " + k).join(", ")}</td></tr>`).join("");
    err.classList.add("hidden");
  } catch (e) {                                    // skenario tidak normal: gagal dimuat -> pesan + "Coba Lagi"
    rows.innerHTML = ""; err.classList.remove("hidden");
  }
}
document.addEventListener("DOMContentLoaded", () => { document.getElementById("retry").onclick = render; render(); });
