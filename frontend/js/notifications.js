let currentPage = 1;

const limit = 5;

loadUsers();
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
LOAD USERS DROPDOWN
=====================================
*/

async function loadUsers()
{
    try {

        const response =
            await fetch(
                '../../api/user-options.php'
            );

        const result =
            await response.json();

        let html =
            '<option value="">Select User</option>';

        result.data.forEach(user =>
        {
            html += `
                <option value="${user.user_id}">
                    ${user.full_name}
                    (${user.role})
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
                <td colspan="5">
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

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteNotification(
                            ${notification.notification_id}
                        )">

                        Delete

                    </button>

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
DELETE NOTIFICATION
=====================================
*/

async function deleteNotification(id)
{
    if(
        !confirm(
            'Delete notification?'
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
                '../../api/notifications.php',
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
                        notification_id: id
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

        loadNotifications();

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