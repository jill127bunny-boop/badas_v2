<?php
header("Access-Control-Allow-Origin: *"); // Tambahkan ini di paling atas file PHP
header('Content-Type: application/json');

// Koneksi ke Database (Ganti dengan kredensial Anda)
$conn = new mysqli("localhost", "root", "", "badas");

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// Ambil semua pemain, diurutkan berdasarkan tier
$sql = "SELECT nama, tier, photo_url, status_marker FROM pemain ORDER BY tier DESC, nama ASC";
$result = $conn->query($sql);

$players = ['Tier S' => [], 'Tier A' => []];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $tier_key = $row['tier'] === 'S' ? 'Tier S' : 'Tier A';
        $players[$tier_key][] = [
            'name' => $row['nama'],
            'photoUrl' => $row['photo_url'],
            'marker' => $row['status_marker'] // Kirim status marker
        ];
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($players);
?>