let currentPage = 1;

const limit = 5;

loadStudents();
loadNotifications();

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
LOAD STUDENTS DROPDOWN
=====================================
*/

async function loadStudents()
{
    try {

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
            'user_id'
        ).innerHTML =
        html;

    }
    catch(error)
    {
        console.error(error);
    }
}

/*
=====================================
LOAD NOTIFICATIONS
=====================================
*/

async function loadNotifications()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
        `../../api/notifications.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
            '&search=' +
            encodeURIComponent(search);
    }

    document.getElementById(
        'notificationTable'
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
                'notificationTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="4">
                    No notifications found
                </td>
            </tr>
            `;

            return;
        }

        let html = '';

        result.data.forEach(notification =>
        {
            html += `
            <tr>

                <td>
                    ${notification.notification_id}
                </td>

                <td>
                    ${notification.full_name}
                </td>

                <td>
                    ${notification.message}
                </td>

                <td>
                    ${notification.created_at}
                </td>

            </tr>
            `;
        });

        document.getElementById(
            'notificationTable'
        ).innerHTML =
        html;

    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to load notifications'
        );
    }
}

/*
=====================================
SAVE NOTIFICATION
=====================================
*/

async function saveNotification()
{
    const token =
        localStorage.getItem('token');

    const userId =
        document.getElementById(
            'user_id'
        ).value;

    const message =
        document.getElementById(
            'notification_message'
        ).value.trim();

    if(
        !userId ||
        !message
    )
    {
        showMessage(
            'All fields are required'
        );

        return;
    }

    try {

        const response =
            await fetch(
                '../../api/notifications.php',
                {
                    method: 'POST',

                    headers:
                    {
                        'Content-Type':
                        'application/json',

                        Authorization:
                        'Bearer ' + token
                    },

                    body:
                    JSON.stringify({
                        user_id: userId,
                        message: message
                    })
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

        loadNotifications();

    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to send notification'
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
        'user_id'
    ).value = '';

    document.getElementById(
        'notification_message'
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

    loadNotifications();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadNotifications();
    }
}