<?php

header("Content-Type: application/json");

require '../config/database.php';

$stmt = $conn->prepare("
    SELECT
        user_id,
        full_name
    FROM users
    WHERE role = 'lecturer'
");

$stmt->execute();

echo json_encode([
    "success" => true,
    "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);