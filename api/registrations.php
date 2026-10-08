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
        GET REGISTRATION(S)
        =====================================
        */
        case "GET":

            $registrationId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';

            $page = isset($_GET['page'])
                ? (int)$_GET['page']
                : 1;

            $limit = isset($_GET['limit'])
                ? (int)$_GET['limit']
                : 5;

            $offset = ($page - 1) * $limit;

            /*
            SINGLE REGISTRATION
            */

            if ($registrationId) {

                $stmt = $conn->prepare("
                    SELECT
                        r.registration_id,
                        r.student_id,
                        r.course_id,
                        u.full_name AS student_name,
                        c.course_code,
                        c.course_name
                    FROM registrations r
                    JOIN users u
                        ON r.student_id = u.user_id
                    JOIN courses c
                        ON r.course_id = c.course_id
                    WHERE r.registration_id = ?
                ");

                $stmt->execute([$registrationId]);

                $registration = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$registration) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "Registration not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $registration
                ]);

                exit;
            }

            /*
            ALL REGISTRATIONS
            */

            $sql = "
                SELECT
                    r.registration_id,
                    u.full_name AS student_name,
                    c.course_code,
                    c.course_name
                FROM registrations r
                JOIN users u
                    ON r.student_id = u.user_id
                JOIN courses c
                    ON r.course_id = c.course_id
            ";

            $params = [];

            /*
            STUDENT ONLY SEE OWN REGISTRATION
            */

            if ($user->role === 'student') {

                $sql .= "
                    WHERE r.student_id = ?
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
                            OR c.course_name LIKE ?
                            OR c.course_code LIKE ?
                        )
                    ";

                } else {

                    $sql .= "
                        WHERE (
                            u.full_name LIKE ?
                            OR c.course_name LIKE ?
                            OR c.course_code LIKE ?
                        )
                    ";
                }

                $params[] = "%$search%";
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
        CREATE REGISTRATION
        =====================================
        */
        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['student_id']) ||
                empty($data['course_id'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields required"
                ]);

                exit;
            }

            /*
            CHECK STUDENT
            */

            $studentCheck = $conn->prepare("
                SELECT user_id
                FROM users
                WHERE user_id = ?
                AND role = 'student'
            ");

            $studentCheck->execute([
                $data['student_id']
            ]);

            if (!$studentCheck->fetch()) {

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid student"
                ]);

                exit;
            }

            /*
            CHECK COURSE
            */

            $courseCheck = $conn->prepare("
                SELECT course_id
                FROM courses
                WHERE course_id = ?
            ");

            $courseCheck->execute([
                $data['course_id']
            ]);

            if (!$courseCheck->fetch()) {

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid course"
                ]);

                exit;
            }

            /*
            DUPLICATE CHECK
            */

            $duplicate = $conn->prepare("
                SELECT registration_id
                FROM registrations
                WHERE student_id = ?
                AND course_id = ?
            ");

            $duplicate->execute([
                $data['student_id'],
                $data['course_id']
            ]);

            if ($duplicate->fetch()) {

                echo json_encode([
                    "success" => false,
                    "message" => "Student already registered"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                INSERT INTO registrations
                (
                    student_id,
                    course_id
                )
                VALUES
                (
                    ?, ?
                )
            ");

            $stmt->execute([
                $data['student_id'],
                $data['course_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Registration created"
            ]);

        break;

        /*
        =====================================
        UPDATE REGISTRATION
        =====================================
        */
        case "PUT":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['registration_id'])) {

                echo json_encode([
                    "success" => false,
                    "message" => "registration_id required"
                ]);

                exit;
            }

            $duplicate = $conn->prepare("
                SELECT registration_id
                FROM registrations
                WHERE student_id = ?
                AND course_id = ?
                AND registration_id != ?
            ");

            $duplicate->execute([
                $data['student_id'],
                $data['course_id'],
                $data['registration_id']
            ]);

            if ($duplicate->fetch()) {

                echo json_encode([
                    "success" => false,
                    "message" => "Student already registered"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                UPDATE registrations
                SET
                    student_id = ?,
                    course_id = ?
                WHERE registration_id = ?
            ");

            $stmt->execute([
                $data['student_id'],
                $data['course_id'],
                $data['registration_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Registration updated"
            ]);

        break;

        /*
        =====================================
        DELETE REGISTRATION
        =====================================
        */
        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['registration_id'])) {

                echo json_encode([
                    "success" => false,
                    "message" => "registration_id required"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM registrations
                WHERE registration_id = ?
            ");

            $stmt->execute([
                $data['registration_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Registration deleted"
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