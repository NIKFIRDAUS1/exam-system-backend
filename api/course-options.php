<?php

header("Content-Type: application/json");

require '../config/database.php';

$stmt = $conn->prepare("
    SELECT
        course_id,
        course_code,
        course_name
    FROM courses
    ORDER BY course_code
");

$stmt->execute();

echo json_encode([
    "success" => true,
    "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);