<?php

header("Content-Type: application/json");

require '../config/database.php';

try {

    $stmt = $conn->prepare("
        SELECT
            e.exam_id,
            c.course_code,
            c.course_name,
            e.exam_date
        FROM examinations e
        JOIN courses c
            ON e.course_id = c.course_id
        ORDER BY e.exam_date ASC
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