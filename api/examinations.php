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

/*
GET
Admin + Lecturer + Student
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

/*
POST + PUT
Admin + Lecturer
*/
if (
    in_array(
        $method,
        [
            'POST',
            'PUT'
        ]
    )
) {

    requireRole(
        $user,
        [
            'admin',
            'lecturer'
        ]
    );
}

/*
DELETE
Admin Only
*/
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
        GET EXAMINATION(S)
        =====================================
        */
        case "GET":

            $examId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';

            $page = isset($_GET['page'])
                ? (int)$_GET['page']
                : 1;

            $limit = isset($_GET['limit'])
                ? (int)$_GET['limit']
                : 5;

            $offset = ($page - 1) * $limit;

            /*
            SINGLE EXAM
            */

            if ($examId) {

                $stmt = $conn->prepare("
                    SELECT
                        e.exam_id,
                        e.course_id,
                        e.venue_id,
                        c.course_code,
                        c.course_name,
                        v.venue_name,
                        e.exam_date,
                        e.exam_time
                    FROM examinations e
                    JOIN courses c
                        ON e.course_id = c.course_id
                    JOIN venues v
                        ON e.venue_id = v.venue_id
                    WHERE e.exam_id = ?
                ");

                $stmt->execute([$examId]);

                $exam = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$exam) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "Examination not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $exam
                ]);

                exit;
            }

            /*
            ALL EXAMS
            SEARCH + PAGINATION
            */

            $sql = "
                SELECT
                    e.exam_id,
                    e.course_id,
                    e.venue_id,
                    c.course_code,
                    c.course_name,
                    v.venue_name,
                    e.exam_date,
                    e.exam_time
                FROM examinations e
                JOIN courses c
                    ON e.course_id = c.course_id
                JOIN venues v
                    ON e.venue_id = v.venue_id
            ";

            $params = [];

            if (!empty($search)) {

                $sql .= "
                    WHERE
                        c.course_name LIKE ?
                        OR c.course_code LIKE ?
                        OR v.venue_name LIKE ?
                ";

                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }

            $sql .= "
                ORDER BY e.exam_date ASC
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
        CREATE EXAM
        =====================================
        */
        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['course_id']) ||
                empty($data['venue_id']) ||
                empty($data['exam_date']) ||
                empty($data['exam_time'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields required"
                ]);

                exit;
            }

            $courseCheck = $conn->prepare("
                SELECT course_id
                FROM courses
                WHERE course_id = ?
            ");

            $courseCheck->execute([
                $data['course_id']
            ]);

            if (!$courseCheck->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid course"
                ]);

                exit;
            }

            $venueCheck = $conn->prepare("
                SELECT venue_id
                FROM venues
                WHERE venue_id = ?
            ");

            $venueCheck->execute([
                $data['venue_id']
            ]);

            if (!$venueCheck->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid venue"
                ]);

                exit;
            }

            $duplicate = $conn->prepare("
                SELECT exam_id
                FROM examinations
                WHERE course_id = ?
                AND exam_date = ?
                AND exam_time = ?
            ");

            $duplicate->execute([
                $data['course_id'],
                $data['exam_date'],
                $data['exam_time']
            ]);

            if ($duplicate->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Examination already exists"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                INSERT INTO examinations
                (
                    course_id,
                    venue_id,
                    exam_date,
                    exam_time
                )
                VALUES
                (
                    ?, ?, ?, ?
                )
            ");

            $stmt->execute([
                $data['course_id'],
                $data['venue_id'],
                $data['exam_date'],
                $data['exam_time']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Examination created"
            ]);

        break;

        /*
        =====================================
        UPDATE EXAM
        =====================================
        */
        case "PUT":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['exam_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "exam_id required"
                ]);

                exit;
            }

            $courseCheck = $conn->prepare("
                SELECT course_id
                FROM courses
                WHERE course_id = ?
            ");

            $courseCheck->execute([
                $data['course_id']
            ]);

            if (!$courseCheck->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid course"
                ]);

                exit;
            }

            $venueCheck = $conn->prepare("
                SELECT venue_id
                FROM venues
                WHERE venue_id = ?
            ");

            $venueCheck->execute([
                $data['venue_id']
            ]);

            if (!$venueCheck->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid venue"
                ]);

                exit;
            }

            $duplicate = $conn->prepare("
                SELECT exam_id
                FROM examinations
                WHERE course_id = ?
                AND exam_date = ?
                AND exam_time = ?
                AND exam_id != ?
            ");

            $duplicate->execute([
                $data['course_id'],
                $data['exam_date'],
                $data['exam_time'],
                $data['exam_id']
            ]);

            if ($duplicate->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Examination already exists"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                UPDATE examinations
                SET
                    course_id = ?,
                    venue_id = ?,
                    exam_date = ?,
                    exam_time = ?
                WHERE exam_id = ?
            ");

            $stmt->execute([
                $data['course_id'],
                $data['venue_id'],
                $data['exam_date'],
                $data['exam_time'],
                $data['exam_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Examination updated"
            ]);

        break;

        /*
        =====================================
        DELETE EXAM
        =====================================
        */
        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['exam_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "exam_id required"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM examinations
                WHERE exam_id = ?
            ");

            $stmt->execute([
                $data['exam_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Examination deleted"
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