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

if (
    in_array(
        $method,
        [
            'POST',
            'PUT',
            'DELETE'
        ]
    )
) {

    requireRole(
        $user,
        ['admin']
    );
}

try {

    switch ($method) {

        /*
        =====================================
        GET VENUE(S)
        =====================================
        */
        case "GET":

            $venueId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';

            $page = isset($_GET['page'])
                ? (int)$_GET['page']
                : 1;

            $limit = isset($_GET['limit'])
                ? (int)$_GET['limit']
                : 5;

            $offset = ($page - 1) * $limit;

            /*
            SINGLE VENUE
            */

            if ($venueId) {

                $stmt = $conn->prepare("
                    SELECT *
                    FROM venues
                    WHERE venue_id = ?
                ");

                $stmt->execute([$venueId]);

                $venue = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$venue) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "Venue not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $venue
                ]);

                exit;
            }

            /*
            ALL VENUES
            */

            $sql = "
                SELECT *
                FROM venues
            ";

            $params = [];

            if (!empty($search)) {

                $sql .= "
                    WHERE venue_name LIKE ?
                ";

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

            echo json_encode([
                "success" => true,
                "page" => $page,
                "limit" => $limit,
                "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);

        break;

        /*
        =====================================
        CREATE VENUE
        =====================================
        */

        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['venue_name']) ||
                empty($data['capacity'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields required"
                ]);

                exit;
            }
            if ($data['capacity'] <= 0) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Capacity must be greater than zero"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                INSERT INTO venues
                (
                    venue_name,
                    capacity
                )
                VALUES
                (
                    ?, ?
                )
            ");

            $stmt->execute([
                $data['venue_name'],
                $data['capacity']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Venue created"
            ]);

        break;

        /*
        =====================================
        UPDATE VENUE
        =====================================
        */

        case "PUT":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['venue_id']) ||
                empty($data['venue_name']) ||
                empty($data['capacity'])
            ) {

                echo json_encode([
                    "success" => false,
                    "message" => "all field required"
                ]);

                exit;
            }
            if ($data['capacity'] <= 0) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Capacity must be greater than zero"
                ]);

                exit;
            }
            $stmt = $conn->prepare("
                UPDATE venues
                SET
                    venue_name = ?,
                    capacity = ?
                WHERE venue_id = ?
            ");

            $stmt->execute([
                $data['venue_name'],
                $data['capacity'],
                $data['venue_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Venue updated"
            ]);

        break;

        /*
        =====================================
        DELETE VENUE
        =====================================
        */

        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['venue_id'])) {

                echo json_encode([
                    "success" => false,
                    "message" => "venue_id required"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM venues
                WHERE venue_id = ?
            ");

            $stmt->execute([
                $data['venue_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Venue deleted"
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