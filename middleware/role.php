<?php

function requireRole($user, array $allowedRoles)
{
    if (!isset($user->role)) {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "Role information missing"
        ]);

        exit;
    }

    if (!in_array($user->role, $allowedRoles)) {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "Access denied"
        ]);

        exit;
    }
}