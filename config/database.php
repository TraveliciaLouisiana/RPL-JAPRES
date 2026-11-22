
<?php

$host = "localhost";
$dbname = "japres";
$username = "root";
$password = "";

try {
    $conn = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $conn->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    echo "Database JAPRES berhasil terhubung!";

} catch (PDOException $e) {
    die("Koneksi gagal: " . $e->getMessage());
}

?>
