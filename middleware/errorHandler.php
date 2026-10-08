<?php

function handleException(
    Exception $e
)
{
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "status" => 500,
        "message" => $e->getMessage()
    ]);

    exit;
}