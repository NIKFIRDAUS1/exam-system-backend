<?php

header("Content-Type: application/json");

require '../config/database.php';

$stmt = $conn->prepare("
    SELECT
        venue_id,
        venue_name
    FROM venues
    ORDER BY venue_name
");

$stmt->execute();

echo json_encode([
    "success" => true,
    "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);