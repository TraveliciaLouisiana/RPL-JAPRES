// Fungsi umum yang dipakai oleh seluruh halaman JAPRES.
document.addEventListener("DOMContentLoaded", () => {
  const storedGroup = localStorage.getItem("japresGroup");
  document.querySelectorAll("#sidebarGroup, #summaryGroup").forEach(el => {
    if (el && el.id === "sidebarGroup") el.textContent = storedGroup ? `Kelompok ${storedGroup}` : "Belum bergabung";
    if (el && el.id === "summaryGroup") el.textContent = storedGroup ? `Kelompok ${storedGroup}` : "Belum bergabung";
  });
});

// Membuka dan menutup modal berdasarkan ID.
function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}
document.addEventListener("click", event => {
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) closeModal(closeButton.dataset.close);
  if (event.target.classList.contains("modal-backdrop")) event.target.classList.add("hidden");
});

// Menampilkan pesan singkat di pojok halaman.
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 2600);
}
