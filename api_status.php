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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // --- AKSI 1: UPDATE STATUS MARKER ---
    if ($action === 'update_status' && isset($data['players'])) {
        $players = $data['players'];
        $conn->begin_transaction();
        $success = true;

        foreach ($players as $player) {
            $name = $conn->real_escape_string($player['name']);
            $status = $conn->real_escape_string($player['status']);
            
            $sql = "UPDATE pemain SET status_marker = '$status' WHERE nama = '$name'";
            if (!$conn->query($sql)) {
                $success = false;
                break;
            }
        }
        
        if ($success) {
            $conn->commit();
            echo json_encode(["success" => true, "message" => "Status pemain berhasil diperbarui."]);
        } else {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Gagal memperbarui status pemain."]);
        }
    }
    
    // --- AKSI 2: RESET SEMUA STATUS MARKER (Dipanggil oleh tombol Reset) ---
    else if ($action === 'reset_markers') {
        $sql = "UPDATE pemain SET status_marker = ''";
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Semua marker status berhasil direset."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Gagal mereset marker."]);
        }
    }

} else {
    http_response_code(405);
    echo json_encode(["error" => "Metode tidak diizinkan."]);
}

$conn->close();
?>