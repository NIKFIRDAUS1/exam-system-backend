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

function calculateGrade($marks)
{
    if ($marks >= 80) {
        return 'A';
    }

    if ($marks >= 75) {
        return 'B+';
    }

    if ($marks >= 70) {
        return 'B';
    }

    if ($marks >= 65) {
        return 'C+';
    }

    if ($marks >= 60) {
        return 'C';
    }

    if ($marks >= 50) {
        return 'D';
    }

    return 'F';
}

try {

    switch ($method) {

        case "GET":

            $resultId = $_GET['id'] ?? null;
            $search = $_GET['search'] ?? '';

            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;

            $offset = ($page - 1) * $limit;

            /*
            SINGLE RESULT
            */

            if ($resultId) {

                $stmt = $conn->prepare("
                    SELECT
                        r.result_id,
                        r.student_id,
                        r.exam_id,
                        u.full_name AS student_name,
                        c.course_code,
                        c.course_name,
                        r.marks,
                        r.grade
                    FROM results r
                    JOIN users u
                        ON r.student_id = u.user_id
                    JOIN examinations e
                        ON r.exam_id = e.exam_id
                    JOIN courses c
                        ON e.course_id = c.course_id
                    WHERE r.result_id = ?
                ");

                $stmt->execute([$resultId]);

                $result = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$result) {

                    http_response_code(404);

                    echo json_encode([
                        "success" => false,
                        "message" => "Result not found"
                    ]);

                    exit;
                }

                echo json_encode([
                    "success" => true,
                    "data" => $result
                ]);

                exit;
            }

            /*
            ALL RESULTS
            */

            $sql = "
                SELECT
                    r.result_id,
                    r.student_id,
                    r.exam_id,
                    u.full_name AS student_name,
                    c.course_code,
                    c.course_name,
                    r.marks,
                    r.grade
                FROM results r
                JOIN users u
                    ON r.student_id = u.user_id
                JOIN examinations e
                    ON r.exam_id = e.exam_id
                JOIN courses c
                    ON e.course_id = c.course_id
            ";

                $conditions = [];
                $params = [];

                if ($user->role === 'student') {

                    $conditions[] = "r.student_id = ?";
                    $params[] = $user->user_id;
                }

                if (!empty($search)) {

                    $conditions[] = "
                        (
                            u.full_name LIKE ?
                            OR c.course_name LIKE ?
                            OR c.course_code LIKE ?
                        )
                    ";

                    $params[] = "%$search%";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }

                if (!empty($conditions)) {

                    $sql .= " WHERE " .
                        implode(" AND ", $conditions);
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
        CREATE RESULT
        */

        case "POST":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (
                empty($data['student_id']) ||
                empty($data['exam_id']) ||
                !isset($data['marks'])
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "All fields required"
                ]);

                exit;
            }

            if (
                $data['marks'] < 0 ||
                $data['marks'] > 100
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Marks must be between 0 and 100"
                ]);

                exit;
            }

            $grade = calculateGrade($data['marks']);

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

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Invalid student"
            ]);

            exit;
        }

            $examCheck = $conn->prepare("
                SELECT exam_id
                FROM examinations
                WHERE exam_id = ?
            ");

            $examCheck->execute([
                $data['exam_id']
            ]);

            if (!$examCheck->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid examination"
                ]);

                exit;
            }

            $duplicate = $conn->prepare("
                SELECT result_id
                FROM results
                WHERE student_id = ?
                AND exam_id = ?
            ");

            $duplicate->execute([
                $data['student_id'],
                $data['exam_id']
            ]);

            if ($duplicate->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Result already exists"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                INSERT INTO results
                (
                    student_id,
                    exam_id,
                    marks,
                    grade
                )
                VALUES
                (
                    ?, ?, ?, ?
                )
            ");

            $stmt->execute([
                $data['student_id'],
                $data['exam_id'],
                $data['marks'],
                $grade
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Result created"
            ]);

        break;

        /*
        UPDATE RESULT
        */

        case "PUT":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['result_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "result_id required"
                ]);

                exit;
            }

            if (
                $data['marks'] < 0 ||
                $data['marks'] > 100
            ) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Marks must be between 0 and 100"
                ]);

                exit;
            }

            $grade = calculateGrade($data['marks']);

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

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid student"
                ]);

                exit;
            }

            $examCheck = $conn->prepare("
                SELECT exam_id
                FROM examinations
                WHERE exam_id = ?
            ");

            $examCheck->execute([
                $data['exam_id']
            ]);

            if (!$examCheck->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid examination"
                ]);

                exit;
            }

            $duplicate = $conn->prepare("
                SELECT result_id
                FROM results
                WHERE student_id = ?
                AND exam_id = ?
                AND result_id != ?
            ");

            $duplicate->execute([
                $data['student_id'],
                $data['exam_id'],
                $data['result_id']
            ]);

            if ($duplicate->fetch()) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Result already exists"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                UPDATE results
                SET
                    student_id = ?,
                    exam_id = ?,
                    marks = ?,
                    grade = ?
                WHERE result_id = ?
            ");

            $stmt->execute([
                $data['student_id'],
                $data['exam_id'],
                $data['marks'],
                $grade,
                $data['result_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Result updated"
            ]);

        break;

        /*
        DELETE RESULT
        */

        case "DELETE":

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (empty($data['result_id'])) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "result_id required"
                ]);

                exit;
            }

            $stmt = $conn->prepare("
                DELETE FROM results
                WHERE result_id = ?
            ");

            $stmt->execute([
                $data['result_id']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Result deleted"
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