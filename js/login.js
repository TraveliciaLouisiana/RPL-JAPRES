
const formLogin = document.getElementById("loginForm");

formLogin.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email")
        .value.trim().toLowerCase();

    const password = document.getElementById("password").value;

    const users = [
        {
            email: "akbar.wirawan@unpar.ac.id",
            password: "admin123",
            role: "admin",
            nama: "Akbar Wirawan"
        },
        {
            email: "haryanto.wijaya@unpar.ac.id",
            password: "dosen123",
            role: "dosen",
            nama: "Dr. Haryanto Wijaya, M.T."
        },
        {
            email: "aditya.pratama@student.unpar.ac.id",
            password: "mhs123",
            role: "mahasiswa",
            nama: "Aditya Pratama"
        }
    ];

    const user = users.find(
        akun => akun.email === email &&
                akun.password === password
    );

    if (!user) {
        alert("Email atau password tidak sesuai!");
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
