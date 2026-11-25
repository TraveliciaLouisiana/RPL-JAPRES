// Pembungkus fetch ke backend Spring Boot. Semua path otomatis diawali "/api".
// Contoh: await api("/portal/profil")  ->  GET /api/portal/profil
async function api(path, {
    method = "GET", body
} = {}) {

    let res;
    try {
        res = await fetch("/api" + path, {
            method,
            headers: body ? { "Content-Type": "application/json" } : {},
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error("Tidak dapat terhubung ke server. Pastikan aplikasi Spring Boot sedang berjalan.");
    }

    let data = null;
    try {
        data = await res.json();
    } catch {
        /* respons 204 / tanpa isi */
    }

    if (!res.ok) {
        const err = new Error((data && data.pesan) || `Permintaan gagal (status ${res.status})`);
        err.status = res.status;          // dipakai global.js untuk mendeteksi 401 (sesi habis)
        throw err;
    }
    return data;
}
