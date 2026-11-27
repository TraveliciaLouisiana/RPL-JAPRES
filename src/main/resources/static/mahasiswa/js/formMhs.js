
// Menyimpan semua mata kuliah yang sudah dipilih
let pilihanMatkul = [];


// 1. MEMBUKA DAN MENUTUP PILIHAN KELAS
function bukaKelas(elemen) {

    // Mencari kotak mata kuliah yang diklik
    let kartuMatkul = elemen.closest(".matkul");

    // Mencari bagian pilihan kelas
    let pilihan = kartuMatkul.querySelector(".pilihanKelas");

    // Mengecek apakah pilihan kelas sedang terbuka
    if (pilihan.style.display === "block") {
        pilihan.style.display = "none";
    } else {
        pilihan.style.display = "block";
    }
}


// 2. MEMILIH KELAS
function pilihKelas(elemen) {

    // Mencari kotak mata kuliah
    let kartuMatkul = elemen.closest(".matkul");

    // Mengambil informasi mata kuliah
    let kode = kartuMatkul.querySelector(".kodeMatkul").textContent;
    let nama = kartuMatkul.querySelector(".namaMatkul p").textContent;
    let sks = kartuMatkul.querySelector(".sksMatkul").textContent;

    // Mengambil nama kelas yang diklik
    let kelas = elemen.textContent;

    // Mengubah tulisan SKS menjadi angka
    let jumlahSKS = parseInt(sks);

    // Mengecek apakah mata kuliah ini sudah pernah dipilih
    let index = pilihanMatkul.findIndex(function(matkul) {
        return matkul.kode === kode;
    });

    // Membuat data mata kuliah yang dipilih
    let dataMatkul = {
        kode: kode,
        nama: nama,
        kelas: kelas,
        sks: jumlahSKS
    };

    // Jika sudah pernah dipilih, ganti kelasnya
    if (index !== -1) {
        pilihanMatkul[index] = dataMatkul;
    } else {
        // Jika belum pernah dipilih, masukkan ke daftar
        pilihanMatkul.push(dataMatkul);
    }


    // Menghilangkan tanda pilihan dari kelas sebelumnya
    let semuaKelas = kartuMatkul.querySelectorAll(".pilihanKelas p");

    semuaKelas.forEach(function(item) {
        item.classList.remove("terpilih");
    });

    // Memberikan tanda pada kelas yang dipilih
    elemen.classList.add("terpilih");


    // Menampilkan kelas yang sudah dipilih di bawah nama matkul
    let tulisanKelas = kartuMatkul.querySelector(".kelasTerpilih");

    if (tulisanKelas === null) {
        tulisanKelas = document.createElement("p");
        tulisanKelas.className = "kelasTerpilih";

        kartuMatkul.querySelector(".namaMatkul").after(tulisanKelas);
    }

    tulisanKelas.textContent = kelas;


    // Menutup pilihan kelas setelah memilih
    kartuMatkul.querySelector(".pilihanKelas").style.display = "none";


    // Memperbarui ringkasan
    updateRingkasan();
}

function hapusPilihan(kode) {

    // Mencari posisi mata kuliah dalam array
    let index = pilihanMatkul.findIndex(function(matkul) {
        return matkul.kode === kode;
    });

    // Menghapus mata kuliah dari array
    if (index !== -1) {
        pilihanMatkul.splice(index, 1);
    }

    // Mencari kartu mata kuliah di HTML
    let semuaMatkul = document.querySelectorAll(".matkul");

    semuaMatkul.forEach(function(kartu) {

        let kodeMatkul = kartu.querySelector(".kodeMatkul").textContent;

        if (kodeMatkul === kode) {

            // Menghapus tulisan kelas terpilih
            let tulisanKelas = kartu.querySelector(".kelasTerpilih");

            if (tulisanKelas !== null) {
                tulisanKelas.remove();
            }

            // Menghilangkan tanda kelas yang terpilih
            let semuaKelas = kartu.querySelectorAll(".pilihanKelas p");

            semuaKelas.forEach(function(item) {
                item.classList.remove("terpilih");
            });
        }
    });

    // Memperbarui ringkasan
    updateRingkasan();
}

function updateRingkasan() {

    // Mengambil elemen ringkasan dari HTML
    let daftarPilihan = document.getElementById("daftarPilihan");
    let totalSKS = document.getElementById("totalSKS");
    let totalMatkul = document.getElementById("totalMatkul");

    // Menghitung total SKS
    let jumlahSKS = 0;

    pilihanMatkul.forEach(function(matkul) {
        jumlahSKS += matkul.sks;
    });

    // Menampilkan total SKS dan jumlah mata kuliah
    totalSKS.textContent = jumlahSKS + " SKS";
    totalMatkul.textContent = pilihanMatkul.length;

    // Menghapus isi ringkasan sebelumnya
    daftarPilihan.innerHTML = "";

    // Jika belum ada mata kuliah yang dipilih
    if (pilihanMatkul.length === 0) {

        let pesan = document.createElement("p");
        pesan.id = "belumAdaPilihan";
        pesan.textContent = "Belum ada kelas yang dipilih";

        daftarPilihan.appendChild(pesan);

    } else {

        // Menampilkan setiap mata kuliah yang dipilih
        pilihanMatkul.forEach(function(matkul) {

            // Membuat kotak ringkasan
            let item = document.createElement("div");
            item.className = "itemPilihan";

            // Membuat bagian nama dan kelas
            let informasi = document.createElement("div");

            let nama = document.createElement("p");
            nama.textContent = matkul.nama;

            let kelas = document.createElement("p");
            kelas.textContent = matkul.kelas;

            informasi.appendChild(nama);
            informasi.appendChild(kelas);

            // Membuat tulisan SKS
            let sks = document.createElement("span");
            sks.textContent = matkul.sks + " SKS";

            // Membuat tombol hapus
            let tombolHapus = document.createElement("button");
            tombolHapus.textContent = "Hapus";
            tombolHapus.type = "button";

            tombolHapus.onclick = function() {
                hapusPilihan(matkul.kode);
            };

            // Memasukkan semuanya ke kotak ringkasan
            item.appendChild(informasi);
            item.appendChild(sks);
            item.appendChild(tombolHapus);

            daftarPilihan.appendChild(item);
        });
    }
}

// 4. TOMBOL SIMPAN
function submitPilihan() {

    // Mengecek apakah sudah ada mata kuliah yang dipilih
    if (pilihanMatkul.length === 0) {
        alert("Silakan pilih mata kuliah terlebih dahulu!");
        return;
    }

    // Menampilkan pesan jika berhasil memilih
    alert("Pilihan kelas berhasil disimpan!");
    
    // Data pilihan bisa digunakan untuk proses berikutnya
    console.log(pilihanMatkul);
}
