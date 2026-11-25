const formLogin = document.getElementById("loginForm");

formLogin.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    let user;
    try {
        // Dicek ke database lewat POST /api/auth/login
        user = await api("/auth/login", { method: "POST", body: { email, password } });
    } catch (err) {
        alert(err.message);
        return;
    }

    sessionStorage.setItem("userRole", user.role);
    sessionStorage.setItem("userName", user.nama);
    sessionStorage.setItem("userEmail", user.email);

    // Arahkan berdasarkan role
    if (user.role === "admin") {
        window.location.href = "admin-dashboard.html";
    }
    else if (user.role === "mahasiswa") {
        window.location.href = "jadwal.html";
    }
    else if (user.role === "dosen") {
        window.location.href = "dosen-dashboard.html";
    }
});
