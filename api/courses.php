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
Admin + Lecturer
*/
if ($method === 'GET') {

    requireRole(
        $user,
        [
            'admin',
            'lecturer'
        ]
    );
}

/*
POST, PUT, DELETE
Admin Only
*/
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
        GET COURSE(S)
        =====================================
        */
        case "GET":

            $courseId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';

            $page = isset($_GET['page'])
                ? (int)$_GET['page']
                : 1;

            $limit = isset($_GET['limit'])
                ? (int)$_GET['limit']
                : 5;

            $offset = ($page - 1) * $limit;

            /*
            SINGLE COURSE
            */

            if ($courseId) {

                $stmt = $conn->prepare("
                    SELECT
                        c.course_id,
                        c.course_code,
                        c.course_name,
                        c.lecturer_id,
                        u.full_name AS lecturer
                    FROM courses c
                    JOIN users u
                        ON c.lecturer_id = u.user_id
                    WHERE c.course_id = ?
                ");

                $stmt->execute([$courseId]);

                $course = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$course) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "Course not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $course
                ]);

                exit;
            }

            /*
            ALL COURSES
            SEARCH + PAGINATION
            */

            $sql = "
                SELECT
                    c.course_id,
                    c.course_code,
                    c.course_name,
                    c.lecturer_id,
                    u.full_name AS lecturer
                FROM courses c
                JOIN users u
                    ON c.lecturer_id = u.user_id
            ";

            $params = [];

            if (!empty($search)) {

                $sql .= "
                    WHERE
                    c.course_name LIKE ?
                    OR c.course_code LIKE ?
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

            echo json_encode([
                "success" => true,
                "page" => $page,
                "limit" => $limit,
                "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);

        break;

        /*
        =====================================
        CREATE COURSE
        =====================================
        */
        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['course_code']) ||
                empty($data['course_name']) ||
                empty($data['lecturer_id'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields required"
                ]);

                exit;
            }
            
                $check = $conn->prepare("
                    SELECT course_id
                    FROM courses
                    WHERE course_code = ?
                ");

                $check->execute([
                    $data['course_code']
                ]);

                if ($check->fetch()) {

                    http_response_code(400);

                    echo json_encode([
                        "success" => false,
                        "message" => "Course code already exists"
                    ]);

                    exit;
                }

                $checkLecturer = $conn->prepare("
                    SELECT user_id
                    FROM users
                    WHERE user_id = ?
                    AND role = 'lecturer'
                ");

                $checkLecturer->execute([
                    $data['lecturer_id']
                ]);

                if (!$checkLecturer->fetch()) {

                    http_response_code(400);

                    echo json_encode([
                        "success" => false,
                        "message" => "Invalid lecturer"
                    ]);

                    exit;
                }

            $stmt = $conn->prepare("
                INSERT INTO courses
                (
                    course_code,
                    course_name,
                    lecturer_id
                )
                VALUES
                (
                    ?, ?, ?
                )
            ");

            $stmt->execute([
                $data['course_code'],
                $data['course_name'],
                $data['lecturer_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Course created"
            ]);

        break;

        /*
        =====================================
        UPDATE COURSE
        =====================================
        */
        case "PUT":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['course_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "course_id required"
                ]);

                exit;
            }

            $check = $conn->prepare("
                SELECT course_id
                FROM courses
                WHERE course_code = ?
                AND course_id != ?
            ");

            $check->execute([
                $data['course_code'],
                $data['course_id']
            ]);

            if ($check->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Course code already exists"
                ]);

                exit;
            }

            $checkLecturer = $conn->prepare("
                SELECT user_id
                FROM users
                WHERE user_id = ?
                AND role = 'lecturer'
            ");

            $checkLecturer->execute([
                $data['lecturer_id']
            ]);

            if (!$checkLecturer->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid lecturer"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                UPDATE courses
                SET
                    course_code = ?,
                    course_name = ?,
                    lecturer_id = ?
                WHERE course_id = ?
            ");

            $stmt->execute([
                $data['course_code'],
                $data['course_name'],
                $data['lecturer_id'],
                $data['course_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Course updated"
            ]);

        break;

        /*
        =====================================
        DELETE COURSE
        =====================================
        */
        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['course_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "course_id required"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM courses
                WHERE course_id = ?
            ");

            $stmt->execute([
                $data['course_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Course deleted"
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