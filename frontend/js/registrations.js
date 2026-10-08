let currentPage = 1;

const limit = 5;

loadStudents();
loadCourses();
loadRegistrations();


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

/*
=====================================
LOAD COURSES
=====================================
*/

async function loadCourses()
{
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
            <option value="${course.course_id}">
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

/*
=====================================
LOAD REGISTRATIONS
=====================================
*/

async function loadRegistrations()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
        `../../api/registrations.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
            '&search=' +
            encodeURIComponent(search);
    }

    document.getElementById(
        'registrationTable'
    ).innerHTML =
    `
    <tr>
        <td colspan="4">
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
                'registrationTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="4">
                    No registrations found
                </td>
            </tr>
            `;

            return;
        }

        let html = '';

        result.data.forEach(registration =>
        {
            html += `
            <tr>

                <td>
                    ${registration.registration_id}
                </td>

                <td>
                    ${registration.student_name}
                </td>

                <td>
                    ${registration.course_code}
                    -
                    ${registration.course_name}
                </td>

                <td class="action-buttons">

                    <button
                    class="edit-btn"
                    onclick="editRegistration(
                        ${registration.registration_id}
                    )">

                    Edit

                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteRegistration(
                        ${registration.registration_id}
                    )">

                    Delete

                    </button>

                </td>

            </tr>
            `;
        });

        document.getElementById(
            'registrationTable'
        ).innerHTML =
        html;

    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to load registrations'
        );
    }
}

/*
=====================================
SAVE REGISTRATION
=====================================
*/

async function saveRegistration()
{
    const token =
        localStorage.getItem('token');

    const registrationId =
        document.getElementById(
            'registration_id'
        ).value;

    const studentId =
        document.getElementById(
            'student_id'
        ).value;

    const courseId =
        document.getElementById(
            'course_id'
        ).value;

    if(
        !studentId ||
        !courseId
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
        course_id: courseId
    };

    if(registrationId)
    {
        method = 'PUT';

        body.registration_id =
            registrationId;
    }

    try {

        const response =
            await fetch(
                '../../api/registrations.php',
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

        loadRegistrations();

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
EDIT REGISTRATION
=====================================
*/

async function editRegistration(id)
{
    const token =
        localStorage.getItem('token');

    try {

        const response =
            await fetch(
                '../../api/registrations.php?id=' + id,
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

        const registration =
            result.data;

        document.getElementById(
            'registration_id'
        ).value =
        registration.registration_id;

        document.getElementById(
            'student_id'
        ).value =
        registration.student_id;

        document.getElementById(
            'course_id'
        ).value =
        registration.course_id;

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
DELETE REGISTRATION
=====================================
*/

async function deleteRegistration(id)
{
    if(
        !confirm(
            'Delete this registration?'
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
                '../../api/registrations.php',
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
                        registration_id: id
                    })
                }
            );

        const result =
            await response.json();

        showMessage(
            result.message
        );

        loadRegistrations();

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
        'registration_id'
    ).value = '';

    document.getElementById(
        'student_id'
    ).value = '';

    document.getElementById(
        'course_id'
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

    loadRegistrations();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadRegistrations();
    }
}