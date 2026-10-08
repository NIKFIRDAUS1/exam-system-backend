<?php

header("Content-Type: application/json");

require '../config/database.php';
require '../middleware/auth.php';
require '../middleware/role.php';

$user = verifyToken();

requireRole(
    $user,
    ['admin']
);

$method = $_SERVER['REQUEST_METHOD'];

try {

    switch ($method) {

        /*
        =====================================
        GET USERS
        =====================================
        */
        case "GET":

            $userId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;

            if ($page < 1) $page = 1;
            if ($limit < 1) $limit = 5;

            $offset = ($page - 1) * $limit;

            /*
            GET SINGLE USER
            Example:
            users.php?id=1
            */
            if ($userId) {

                $stmt = $conn->prepare("
                    SELECT
                        user_id,
                        full_name,
                        email,
                        role,
                        created_at
                    FROM users
                    WHERE user_id = ?
                ");

                $stmt->execute([$userId]);

                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "User not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $user
                ]);

                exit;
            }

            /*
            GET ALL USERS
            SEARCH + PAGINATION
            */

            $sql = "
                SELECT
                    user_id,
                    full_name,
                    email,
                    role,
                    created_at
                FROM users
            ";

            $params = [];

            if (!empty($search)) {

                $sql .= "
                    WHERE full_name LIKE ?
                    OR email LIKE ?
                ";

                $params[] = "%$search%";
                $params[] = "%$search%";
            }

            $sql .= "
                LIMIT ?
                OFFSET ?
            ";

            $stmt = $conn->prepare($sql);

            $index = 1;

            foreach ($params as $param) {

                $stmt->bindValue(
                    $index++,
                    $param,
                    PDO::PARAM_STR
                );
            }

            $stmt->bindValue(
                $index++,
                $limit,
                PDO::PARAM_INT
            );

            $stmt->bindValue(
                $index,
                $offset,
                PDO::PARAM_INT
            );

            $stmt->execute();

            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "page" => $page,
                "limit" => $limit,
                "data" => $users
            ]);

        break;

        /*
        =====================================
        CREATE USER
        =====================================
        */
        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['full_name']) ||
                empty($data['email']) ||
                empty($data['password']) ||
                empty($data['role'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields are required"
                ]);

                exit;
            }

            $check = $conn->prepare("
            SELECT user_id
            FROM users
            WHERE email = ?
         ");

            $check->execute([
            $data['email']
         ]);

            if ($check->fetch()) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Email already exists"
            ]);

            exit;
         }
            if (
                !filter_var(
                    $data['email'],
                    FILTER_VALIDATE_EMAIL
                )
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid email format"
                ]);

                exit;
            }

            $hashedPassword = password_hash(
                $data['password'],
                PASSWORD_DEFAULT
            );
            
            $allowedRoles = [
                'admin',
                'lecturer',
                'student'
            ];

            if (!in_array($data['role'], $allowedRoles)) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid role"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                INSERT INTO users
                (
                    full_name,
                    email,
                    password,
                    role
                )
                VALUES
                (
                    ?, ?, ?, ?
                )
            ");

            $stmt->execute([
                $data['full_name'],
                $data['email'],
                $hashedPassword,
                $data['role']
            ]);
            echo json_encode([
                "success" => true,
                "message" => "User created"
            ]);

        break;

        /*
        =====================================
        UPDATE USER
        =====================================
        */
        case "PUT":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['user_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "user_id required"
                ]);

                exit;
            }

                if (
                    !filter_var(
                        $data['email'],
                        FILTER_VALIDATE_EMAIL
                    )
                ) {

                    http_response_code(400);

                    echo json_encode([
                        "success" => false,
                        "message" => "Invalid email format"
                    ]);

                    exit;
                }

                $allowedRoles = [
                    'admin',
                    'lecturer',
                    'student'
                ];

                if (!in_array($data['role'], $allowedRoles)) {

                    http_response_code(400);

                    echo json_encode([
                        "success" => false,
                        "message" => "Invalid role"
                    ]);

                    exit;
                }

            $checkEmail = $conn->prepare("
                SELECT user_id
                FROM users
                WHERE email = ?
                AND user_id != ?
            ");

            $checkEmail->execute([
                $data['email'],
                $data['user_id']
            ]);

            if ($checkEmail->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Email already exists"
                ]);

                exit;
            }
                            
            $stmt = $conn->prepare("
                UPDATE users
                SET
                    full_name = ?,
                    email = ?,
                    role = ?
                WHERE user_id = ?
            ");

            $stmt->execute([
                $data['full_name'],
                $data['email'],
                $data['role'],
                $data['user_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "User updated"
            ]);

        break;

        /*
        =====================================
        DELETE USER
        =====================================
        */
        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['user_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "user_id required"
                ]);

                exit;
            }

            /*
            PREVENT ADMIN FROM
            DELETING OWN ACCOUNT
            */

            if ($data['user_id'] == $user->user_id) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "You cannot delete your own account"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM users
                WHERE user_id = ?
            ");

            $stmt->execute([
                $data['user_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "User deleted"
            ]);

        break;

        default:

            http_response_code(405);

            echo json_encode([
                "success" => false,
                "message" => "Method not allowed"
            ]);

    }

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}