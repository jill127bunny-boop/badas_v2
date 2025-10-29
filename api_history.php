<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "badas"); // Ganti jika perlu

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Koneksi database gagal: " . $conn->connect_error]));
}

$data = json_decode(file_get_contents("php://input"), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // --- AKSI 1: MUAT RIWAYAT PASANGAN (Digunakan untuk validasi) ---
    $sql = "SELECT pemain_a, pemain_b FROM riwayat_pasangan";
    $result = $conn->query($sql);
    $history = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $history[] = [$row['pemain_a'], $row['pemain_b']];
        }
    }
    echo json_encode($history);

} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // --- AKSI 2: TAMBAH RIWAYAT PASANGAN BARU ---
    if ($action === 'add_history' && isset($data['pairs'])) {
        $pairs = $data['pairs'];
        $conn->begin_transaction();
        $success = true;

        foreach ($pairs as $pair) {
            $p1 = $conn->real_escape_string($pair[0]);
            $p2 = $conn->real_escape_string($pair[1]);
            
            // Simpan pasangan dalam urutan yang konsisten (misalnya, yang lebih dulu secara alfabet)
            $player_a = min($p1, $p2);
            $player_b = max($p1, $p2);

            // IGNORE = jika pasangan sudah ada, lewati.
            $sql = "INSERT IGNORE INTO riwayat_pasangan (pemain_a, pemain_b) VALUES ('$player_a', '$player_b')";
            if (!$conn->query($sql)) {
                $success = false;
                break;
            }
        }
        
        if ($success) {
            $conn->commit();
            echo json_encode(["success" => true]);
        } else {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Gagal menambahkan riwayat pasangan."]);
        }
    }
    
    // --- AKSI 3: HAPUS SEMUA RIWAYAT PASANGAN (Dipanggil oleh tombol Reset) ---
    else if ($action === 'reset_history') {
        $sql = "TRUNCATE TABLE riwayat_pasangan";
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Riwayat pasangan berhasil direset."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Gagal mereset riwayat."]);
        }
    }
}
$conn->close();
?>