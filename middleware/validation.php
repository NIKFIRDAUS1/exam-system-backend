<?php

function validateRequiredFields(
    array $data,
    array $requiredFields
)
{
    foreach ($requiredFields as $field) {

        if (
            !isset($data[$field]) ||
            trim((string)$data[$field]) === ''
        ) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "$field is required"
            ]);

            exit;
        }
    }
}