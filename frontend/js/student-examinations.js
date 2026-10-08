let currentPage = 1;

const limit = 5;

document.addEventListener(
    'DOMContentLoaded',
    () =>
    {
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
LOAD EXAMINATIONS
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
                <td colspan="4">
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

        document.getElementById(
            'examTable'
        ).innerHTML =
        `
        <tr>
            <td colspan="4">
                Failed to load examinations
            </td>
        </tr>
        `;
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