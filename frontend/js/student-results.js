let currentPage = 1;

const limit = 5;

/*
=====================================
PAGE LOAD
=====================================
*/

document.addEventListener(
    'DOMContentLoaded',
    () =>
    {
        loadResults();
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
                'resultTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="5">
                    No results found
                </td>
            </tr>
            `;

            return;
        }

        let html = '';

        result.data.forEach(resultItem =>
        {
            html += `
            <tr>

                <td>
                    ${resultItem.result_id}
                </td>

                <td>
                    ${resultItem.course_code}
                </td>

                <td>
                    ${resultItem.course_name}
                </td>

                <td>
                    ${resultItem.marks}
                </td>

                <td>
                    ${resultItem.grade}
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