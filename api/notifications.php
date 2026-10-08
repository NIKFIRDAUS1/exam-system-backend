<?php

header("Content-Type: application/json");

require '../config/database.php';
require '../middleware/auth.php';
require '../middleware/role.php';

$user = verifyToken();

$method = $_SERVER['REQUEST_METHOD'];

/*
=====================================
ROLE CONTROL
=====================================
*/

if ($method === 'GET') {

    requireRole(
        $user,
        [
            'admin',
            'lecturer',
            'student'
        ]
    );
}

if ($method === 'POST') {

    requireRole(
        $user,
        [
            'admin',
            'lecturer'
        ]
    );
}

if ($method === 'DELETE') {

    requireRole(
        $user,
        ['admin']
    );
}

try {

    switch ($method) {

        /*
        =====================================
        GET NOTIFICATION(S)
        =====================================
        */

        case "GET":

            $notificationId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';

            $page = isset($_GET['page'])
                ? (int)$_GET['page']
                : 1;

            $limit = isset($_GET['limit'])
                ? (int)$_GET['limit']
                : 5;

            $offset = ($page - 1) * $limit;

            /*
            SINGLE NOTIFICATION
            */

            if ($notificationId) {

                $stmt = $conn->prepare("
                    SELECT
                        n.notification_id,
                        u.full_name,
                        n.message,
                        n.created_at
                    FROM notifications n
                    JOIN users u
                        ON n.user_id = u.user_id
                    WHERE n.notification_id = ?
                ");

                $stmt->execute([
                    $notificationId
                ]);

                $notification = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$notification) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "Notification not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $notification
                ]);

                exit;
            }

            /*
            ALL NOTIFICATIONS
            */

            $sql = "
                SELECT
                    n.notification_id,
                    u.full_name,
                    n.message,
                    n.created_at
                FROM notifications n
                JOIN users u
                    ON n.user_id = u.user_id
            ";

            $params = [];

            /*
            STUDENT ONLY SEE OWN NOTIFICATIONS
            */

            if ($user->role === 'student') {

                $sql .= "
                    WHERE n.user_id = ?
                ";

                $params[] = $user->user_id;
            }

            /*
            SEARCH
            */

            if (!empty($search)) {

                if ($user->role === 'student') {

                    $sql .= "
                        AND (
                            u.full_name LIKE ?
                            OR n.message LIKE ?
                        )
                    ";

                } else {

                    $sql .= "
                        WHERE (
                            u.full_name LIKE ?
                            OR n.message LIKE ?
                        )
                    ";
                }

                $params[] = "%$search%";
                $params[] = "%$search%";
            }

            $sql .= "
                ORDER BY n.created_at DESC
                LIMIT ?
                OFFSET ?
            ";

            $stmt = $conn->prepare($sql);

            $index = 1;

            foreach ($params as $param) {

                if (is_int($param)) {

                    $stmt->bindValue(
                        $index++,
                        $param,
                        PDO::PARAM_INT
                    );

                } else {

                    $stmt->bindValue(
                        $index++,
                        $param,
                        PDO::PARAM_STR
                    );
                }
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

            echo json_encode([
                "success" => true,
                "page" => $page,
                "limit" => $limit,
                "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);

        break;

        /*
        =====================================
        CREATE NOTIFICATION
        =====================================
        */

        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['user_id']) ||
                empty($data['message'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields required"
                ]);

                exit;
            }

            /*
            CHECK USER EXISTS
            */

            $userCheck = $conn->prepare("
                SELECT user_id
                FROM users
                WHERE user_id = ?
            ");

            $userCheck->execute([
                $data['user_id']
            ]);

            if (!$userCheck->fetch()) {

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid user"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                INSERT INTO notifications
                (
                    user_id,
                    message
                )
                VALUES
                (
                    ?, ?
                )
            ");

            $stmt->execute([
                $data['user_id'],
                $data['message']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Notification created"
            ]);

        break;

        /*
        =====================================
        DELETE NOTIFICATION
        =====================================
        */

        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['notification_id'])) {

                echo json_encode([
                    "success" => false,
                    "message" => "notification_id required"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM notifications
                WHERE notification_id = ?
            ");

            $stmt->execute([
                $data['notification_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Notification deleted"
            ]);

        break;

        default:

            http_response_code(405);

            echo json_encode([
                "success" => false,
                "message" => "Method not allowed"
            ]);

    }

} catch(PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}