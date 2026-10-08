<?php

header("Content-Type: application/json");

require '../config/database.php';

try {

    $stmt = $conn->prepare("
        SELECT
            user_id,
            full_name
        FROM users
        WHERE role = 'student'
        ORDER BY full_name
    ");

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch(PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}