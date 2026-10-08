let currentPage = 1;

const limit = 5;

loadStudents();
loadExaminations();
loadResults();

/*
=====================================
AUTH HANDLER
=====================================
*/

function handleAuthError(result)
{
    if (
        result.message ===
        'Invalid or expired token'
        ||
        result.message ===
        'Token missing'
    )
    {
        alert(
            'Session expired. Please login again.'
        );

        localStorage.clear();

        window.location.href =
        '../login.html';

        return true;
    }

    return false;
}

/*
=====================================
MESSAGE
=====================================
*/

function showMessage(message)
{
    const msg =
        document.getElementById(
            'message'
        );

    if(msg)
    {
        msg.innerHTML = message;
    }
}

/*
=====================================
LOAD STUDENTS
=====================================
*/

async function loadStudents()
{
    try
    {
        const response =
            await fetch(
                '../../api/student-options.php'
            );

        const result =
            await response.json();

        let html =
            '<option value="">Select Student</option>';

        result.data.forEach(student =>
        {
            html += `
                <option value="${student.user_id}">
                    ${student.full_name}
                </option>
            `;
        });

        document.getElementById(
            'student_id'
        ).innerHTML = html;
    }
    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
LOAD EXAMINATIONS
=====================================
*/

async function loadExaminations()
{
    try
    {
        const response =
            await fetch(
                '../../api/examination-options.php'
            );

        const result =
            await response.json();

        let html =
            '<option value="">Select Examination</option>';

        result.data.forEach(exam =>
        {
            html += `
                <option value="${exam.exam_id}">
                    ${exam.course_code}
                    -
                    ${exam.course_name}
                    (${exam.exam_date})
                </option>
            `;
        });

        document.getElementById(
            'exam_id'
        ).innerHTML = html;
    }
    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
LOAD RESULTS
=====================================
*/

async function loadResults()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
        `../../api/results.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
            '&search=' +
            encodeURIComponent(search);
    }

    document.getElementById(
        'resultTable'
    ).innerHTML =
    `
    <tr>
        <td colspan="6">
            Loading...
        </td>
    </tr>
    `;

    try
    {
        const response =
            await fetch(
                url,
                {
                    headers:
                    {
                        Authorization:
                        'Bearer ' + token
                    }
                }
            );

        const result =
            await response.json();

        if(!result.success)
        {
            handleAuthError(result);

            showMessage(
                result.message
            );

            return;
        }

        document.getElementById(
            'prevBtn'
        ).disabled =
        currentPage === 1;

        document.getElementById(
            'nextBtn'
        ).disabled =
        result.data.length < limit;

        document.getElementById(
            'pageInfo'
        ).innerText =
        `Page ${currentPage}`;

        if(result.data.length === 0)
        {
            document.getElementById(
                'resultTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="6">
                    No results found
                </td>
            </tr>
            `;

            return;
        }

        let html = '';

        result.data.forEach(row =>
        {
            html += `
            <tr>

                <td>
                    ${row.result_id}
                </td>

                <td>
                    ${row.student_name}
                </td>

                <td>
                    ${row.course_code}
                    -
                    ${row.course_name}
                </td>

                <td>
                    ${row.marks}
                </td>

                <td>
                    ${row.grade}
                </td>

                <td class="action-buttons">

                    <button
                    class="edit-btn"
                    onclick="editResult(
                        ${row.result_id}
                    )">

                    Edit

                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteResult(
                        ${row.result_id}
                    )">

                    Delete

                    </button>

                </td>

            </tr>
            `;
        });

        document.getElementById(
            'resultTable'
        ).innerHTML =
        html;
    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to load results'
        );
    }
}

/*
=====================================
SAVE RESULT
=====================================
*/

async function saveResult()
{
    const token =
        localStorage.getItem('token');

    const resultId =
        document.getElementById(
            'result_id'
        ).value;

    const studentId =
        document.getElementById(
            'student_id'
        ).value;

    const examId =
        document.getElementById(
            'exam_id'
        ).value;

    const marks =
        document.getElementById(
            'marks'
        ).value;

    if(
        !studentId ||
        !examId ||
        marks === ''
    )
    {
        showMessage(
            'All fields are required'
        );

        return;
    }

    let method = 'POST';

    let body =
    {
        student_id: studentId,
        exam_id: examId,
        marks: marks
    };

    if(resultId)
    {
        method = 'PUT';

        body.result_id =
            resultId;
    }

    try
    {
        const response =
            await fetch(
                '../../api/results.php',
                {
                    method: method,

                    headers:
                    {
                        'Content-Type':
                        'application/json',

                        Authorization:
                        'Bearer ' + token
                    },

                    body:
                    JSON.stringify(body)
                }
            );

        const result =
            await response.json();

        if(!result.success)
        {
            showMessage(
                result.message
            );

            return;
        }

        showMessage(
            result.message
        );

        clearForm();

        loadResults();
    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Operation failed'
        );
    }
}

/*
=====================================
EDIT RESULT
=====================================
*/

async function editResult(id)
{
    const token =
        localStorage.getItem('token');

    try
    {
        const response =
            await fetch(
                '../../api/results.php?id=' + id,
                {
                    headers:
                    {
                        Authorization:
                        'Bearer ' + token
                    }
                }
            );

        const result =
            await response.json();

        if(!result.success)
        {
            showMessage(
                result.message
            );

            return;
        }

        const row =
            result.data;

        document.getElementById(
            'result_id'
        ).value =
        row.result_id;

        document.getElementById(
            'student_id'
        ).value =
        row.student_id;

        document.getElementById(
            'exam_id'
        ).value =
        row.exam_id;

        document.getElementById(
            'marks'
        ).value =
        row.marks;

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
DELETE RESULT
=====================================
*/

async function deleteResult(id)
{
    if(
        !confirm(
            'Delete result?'
        )
    )
    {
        return;
    }

    const token =
        localStorage.getItem('token');

    try
    {
        const response =
            await fetch(
                '../../api/results.php',
                {
                    method: 'DELETE',

                    headers:
                    {
                        'Content-Type':
                        'application/json',

                        Authorization:
                        'Bearer ' + token
                    },

                    body:
                    JSON.stringify({
                        result_id: id
                    })
                }
            );

        const result =
            await response.json();

        showMessage(
            result.message
        );

        loadResults();
    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Delete failed'
        );
    }
}

/*
=====================================
CLEAR FORM
=====================================
*/

function clearForm()
{
    document.getElementById(
        'result_id'
    ).value = '';

    document.getElementById(
        'student_id'
    ).value = '';

    document.getElementById(
        'exam_id'
    ).value = '';

    document.getElementById(
        'marks'
    ).value = '';

    showMessage('');
}

/*
=====================================
PAGINATION
=====================================
*/

function nextPage()
{
    currentPage++;

    loadResults();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadResults();
    }
}