<?php

require_once '../vendor/autoload.php';
require_once '../config/jwt.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function verifyToken()
{
    $headers = getallheaders();

    $authHeader =
        $headers['Authorization']
        ?? $headers['authorization']
        ?? null;

    if (!$authHeader) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Token missing"
        ]);

        exit;
    }

    $token = str_replace(
        'Bearer ',
        '',
        $authHeader
    );

    try {

        $decoded = JWT::decode(
            $token,
            new Key(
                JWT_SECRET,
                'HS256'
            )
        );

        return $decoded;

    } catch (Exception $e) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Invalid or expired token"
        ]);

        exit;
    }
}