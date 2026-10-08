let currentPage = 1;

const limit = 5;

const role =
    localStorage.getItem('role');

if(role !== 'lecturer')
{
    window.location.href =
    '../login.html';
}

document.addEventListener(
    'DOMContentLoaded',
    () =>
    {
        loadCourses();
        loadVenues();
        loadExams();
    }
);

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
LOAD COURSES
=====================================
*/

async function loadCourses()
{
    try {

        const response =
            await fetch(
                '../../api/course-options.php'
            );

        const result =
            await response.json();

        let html =
            '<option value="">Select Course</option>';

        result.data.forEach(course =>
        {
            html += `
                <option
                value="${course.course_id}">

                    ${course.course_code}
                    -
                    ${course.course_name}

                </option>
            `;
        });

        document.getElementById(
            'course_id'
        ).innerHTML = html;

    }
    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
LOAD VENUES
=====================================
*/

async function loadVenues()
{
    try {

        const response =
            await fetch(
                '../../api/venue-options.php'
            );

        const result =
            await response.json();

        let html =
            '<option value="">Select Venue</option>';

        result.data.forEach(venue =>
        {
            html += `
                <option
                value="${venue.venue_id}">

                    ${venue.venue_name}

                </option>
            `;
        });

        document.getElementById(
            'venue_id'
        ).innerHTML = html;

    }
    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
LOAD EXAMS
=====================================
*/

async function loadExams()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
        `../../api/examinations.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
            '&search=' +
            encodeURIComponent(search);
    }

    document.getElementById(
        'examTable'
    ).innerHTML =
    `
    <tr>
        <td colspan="6">
            Loading...
        </td>
    </tr>
    `;

    try {

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
                'examTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="6">
                    No examinations found
                </td>
            </tr>
            `;

            return;
        }

        let html = '';

        result.data.forEach(exam =>
        {
            html += `
            <tr>

                <td>
                    ${exam.exam_id}
                </td>

                <td>
                    ${exam.course_code}
                    -
                    ${exam.course_name}
                </td>

                <td>
                    ${exam.venue_name}
                </td>

                <td>
                    ${exam.exam_date}
                </td>

                <td>
                    ${exam.exam_time}
                </td>

                <td class="action-buttons">

                    <button
                    class="edit-btn"
                    onclick="editExam(
                        ${exam.exam_id}
                    )">

                        Edit

                    </button>

                </td>

            </tr>
            `;
        });

        document.getElementById(
            'examTable'
        ).innerHTML =
        html;

    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to load examinations'
        );
    }
}

/*
=====================================
SAVE EXAM
=====================================
*/

async function saveExam()
{
    const token =
        localStorage.getItem('token');

    const examId =
        document.getElementById(
            'exam_id'
        ).value;

    const courseId =
        document.getElementById(
            'course_id'
        ).value;

    const venueId =
        document.getElementById(
            'venue_id'
        ).value;

    const examDate =
        document.getElementById(
            'exam_date'
        ).value;

    const examTime =
        document.getElementById(
            'exam_time'
        ).value;

    if(
        !courseId ||
        !venueId ||
        !examDate ||
        !examTime
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
        course_id: courseId,
        venue_id: venueId,
        exam_date: examDate,
        exam_time: examTime
    };

    if(examId)
    {
        method = 'PUT';

        body.exam_id =
            examId;
    }

    try {

        const response =
            await fetch(
                '../../api/examinations.php',
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
            handleAuthError(result);

            showMessage(
                result.message
            );

            return;
        }

        showMessage(
            result.message
        );

        clearForm();

        loadExams();

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
EDIT EXAM
=====================================
*/

async function editExam(id)
{
    const token =
        localStorage.getItem('token');

    try {

        const response =
            await fetch(
                '../../api/examinations.php?id=' + id,
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

        const exam =
            result.data;

        document.getElementById(
            'exam_id'
        ).value =
        exam.exam_id;

        document.getElementById(
            'course_id'
        ).value =
        exam.course_id;

        document.getElementById(
            'venue_id'
        ).value =
        exam.venue_id;

        document.getElementById(
            'exam_date'
        ).value =
        exam.exam_date;

        document.getElementById(
            'exam_time'
        ).value =
        exam.exam_time.substring(
            0,
            5
        );

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
CLEAR FORM
=====================================
*/

function clearForm()
{
    document.getElementById(
        'exam_id'
    ).value = '';

    document.getElementById(
        'course_id'
    ).value = '';

    document.getElementById(
        'venue_id'
    ).value = '';

    document.getElementById(
        'exam_date'
    ).value = '';

    document.getElementById(
        'exam_time'
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

    loadExams();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadExams();
    }
}