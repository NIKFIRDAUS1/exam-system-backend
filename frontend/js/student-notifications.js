let currentPage = 1;

const limit = 5;

document.addEventListener(
    'DOMContentLoaded',
    () =>
    {
        loadNotifications();
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
        <td colspan="3">
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
                <td colspan="3">
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
    }
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