let currentPage = 1;

const limit = 5;

loadLecturers();
loadCourses();

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
LOAD LECTURERS
=====================================
*/

async function loadLecturers()
{
    try {

        const response =
            await fetch(
                '../../api/lecturers.php'
            );

        const result =
            await response.json();

        let html =
        `
        <option value="">
            Select Lecturer
        </option>
        `;

        result.data.forEach(
            lecturer =>
        {
            html += `
            <option value="${lecturer.user_id}">
                ${lecturer.full_name}
            </option>
            `;
        });

        document.getElementById(
            'lecturer_id'
        ).innerHTML = html;
    }

    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
LOAD COURSES
=====================================
*/

async function loadCourses()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
    `../../api/courses.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
        '&search=' +
        encodeURIComponent(search);
    }

    document.getElementById(
        'courseTable'
    ).innerHTML =
    `
    <tr>
        <td colspan="5">
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

        if(
            result.data.length === 0
        )
        {
            document.getElementById(
                'courseTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="5">
                    No courses found
                </td>
            </tr>
            `;

            document.getElementById(
                'pageInfo'
            ).innerText =
            `Page ${currentPage}`;

            return;
        }

        let html = '';

        result.data.forEach(course =>
        {
            html += `
            <tr>

                <td>
                    ${course.course_id}
                </td>

                <td>
                    ${course.course_code}
                </td>

                <td>
                    ${course.course_name}
                </td>

                <td>
                    ${course.lecturer}
                </td>

                <td class="action-buttons">

                    <button
                    class="edit-btn"
                    onclick="editCourse(
                        ${course.course_id},
                        '${course.course_code}',
                        '${course.course_name.replace(/'/g,"\\'")}',
                        ${course.lecturer_id}
                    )">

                    Edit

                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteCourse(
                        ${course.course_id}
                    )">

                    Delete

                    </button>

                </td>

            </tr>
            `;
        });

        document.getElementById(
            'courseTable'
        ).innerHTML = html;

        document.getElementById(
            'pageInfo'
        ).innerText =
        `Page ${currentPage}`;
    }

    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to load courses'
        );
    }
}

/*
=====================================
SAVE COURSE
=====================================
*/

async function saveCourse()
{
    const token =
        localStorage.getItem('token');

    const courseId =
        document.getElementById(
            'course_id'
        ).value;

    const courseCode =
        document.getElementById(
            'course_code'
        ).value.trim();

    const courseName =
        document.getElementById(
            'course_name'
        ).value.trim();

    const lecturerId =
        document.getElementById(
            'lecturer_id'
        ).value;

    if(
        !courseCode ||
        !courseName ||
        !lecturerId
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
        course_code: courseCode,
        course_name: courseName,
        lecturer_id: lecturerId
    };

    if(courseId)
    {
        method = 'PUT';

        body.course_id =
        courseId;
    }

    try {

        const response =
            await fetch(
                '../../api/courses.php',
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

        loadCourses();
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
EDIT COURSE
=====================================
*/

function editCourse(
    id,
    code,
    name,
    lecturerId
)
{
    document.getElementById(
        'course_id'
    ).value = id;

    document.getElementById(
        'course_code'
    ).value = code;

    document.getElementById(
        'course_name'
    ).value = name;

    document.getElementById(
        'lecturer_id'
    ).value = lecturerId;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/*
=====================================
DELETE COURSE
=====================================
*/

async function deleteCourse(id)
{
    if(
        !confirm(
            'Delete this course?'
        )
    )
    {
        return;
    }

    const token =
        localStorage.getItem('token');

    try {

        const response =
            await fetch(
                '../../api/courses.php',
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
                        course_id: id
                    })
                }
            );

        const result =
            await response.json();

        showMessage(
            result.message
        );

        loadCourses();
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
        'course_id'
    ).value = '';

    document.getElementById(
        'course_code'
    ).value = '';

    document.getElementById(
        'course_name'
    ).value = '';

    document.getElementById(
        'lecturer_id'
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

    loadCourses();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadCourses();
    }
}