let currentPage = 1;

loadCourses();

async function loadCourses()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById(
            'search'
        ).value;

    const response =
        await fetch(
            '../../api/courses.php?page=' +
            currentPage +
            '&search=' +
            encodeURIComponent(search),
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

    let html = '';

    result.data.forEach(course =>
    {
        html += `
            <tr>

                <td>${course.course_id}</td>

                <td>${course.course_code}</td>

                <td>${course.course_name}</td>

                <td>${course.lecturer}</td>

            </tr>
        `;
    });

    document.getElementById(
        'courseTable'
    ).innerHTML = html;

    document.getElementById(
        'pageInfo'
    ).innerText =
        'Page ' + currentPage;
}

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