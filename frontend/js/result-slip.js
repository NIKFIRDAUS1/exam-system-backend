let qr = null;

document.addEventListener(
    'DOMContentLoaded',
    () =>
    {
        loadResultSlip();
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
LOAD RESULT SLIP QR
=====================================
*/

async function loadResultSlip()
{
    const token =
        localStorage.getItem('token');

    try {

        const response =
            await fetch(
                '../../api/results.php?page=1&limit=100',
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

        if(result.data.length === 0)
        {
            document.getElementById(
                'qrContainer'
            ).innerHTML =
            '<p>No results available.</p>';

            return;
        }

        /*
        =====================================
        BUILD QR CONTENT
        =====================================
        */

        const studentName =
            result.data[0].student_name;

        const studentId =
            result.data[0].student_id;

        let qrText =
`EXAMINATION RESULT SLIP

Student: ${studentName}
Student ID: ${studentId}

`;

        result.data.forEach(row =>
        {
            qrText +=
`${row.course_code}
${row.course_name}
Marks: ${row.marks}
Grade: ${row.grade}

`;
        });

        qrText +=
`Total Subjects: ${result.data.length}`;

        /*
        =====================================
        GENERATE QR
        =====================================
        */

        const qrUrl =
            'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' +
            encodeURIComponent(qrText);

        document.getElementById(
            'qrContainer'
        ).innerHTML =
        `
        <img
            src="${qrUrl}"
            alt="Result Slip QR"
            class="qr-image">
        `;
    }
    catch(error)
    {
        console.error(error);

        document.getElementById(
            'qrContainer'
        ).innerHTML =
        '<p>Failed to load QR Code.</p>';
    }
}

/*
=====================================
PRINT RESULT SLIP
=====================================
*/

function printSlip()
{
    window.print();
}