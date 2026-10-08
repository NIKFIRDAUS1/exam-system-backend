<?php

require '../config/database.php';
require '../config/jwt.php';
require '../vendor/autoload.php';

use Firebase\JWT\JWT;

header("Content-Type: application/json");

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Email and password are required"
    ]);

    exit;
}

$sql = "
SELECT *
FROM users
WHERE email = ?
";

$stmt = $conn->prepare($sql);

$stmt->execute([$email]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);

    exit;
}

if (!password_verify($password, $user['password'])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);

    exit;
}

/*
=====================================
JWT PAYLOAD
=====================================
*/

$payload = [

    "user_id" => $user['user_id'],

    "full_name" => $user['full_name'],

    "role" => $user['role'],

    "iat" => time(),

    "exp" => time() + 3600
];

/*
=====================================
GENERATE TOKEN
=====================================
*/

$token = JWT::encode(
    $payload,
    JWT_SECRET,
    'HS256'
);

echo json_encode([
    "success" => true,
    "token" => $token,
    "user" => [
        "id" => $user['user_id'],
        "name" => $user['full_name'],
        "role" => $user['role']
    ]
]);