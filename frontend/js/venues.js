let currentPage = 1;
const limit = 5;


loadVenues();


/*
=====================================
AUTH HANDLER
=====================================
*/

function handleAuthError(result)
{
    if (
        result.message === 'Invalid or expired token' ||
        result.message === 'Token missing'
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
        document.getElementById('message');

    if(msg)
    {
        msg.innerHTML = message;
    }
}

/*
=====================================
LOAD VENUES
=====================================
*/

async function loadVenues()
{
    const token =
        localStorage.getItem('token');

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
    `../../api/venues.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
        '&search=' +
        encodeURIComponent(search);
    }

    document.getElementById(
        'venueTable'
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

            showMessage(result.message);

            return;
        }

        if(result.data.length === 0)
        {
            document.getElementById(
                'venueTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="4">
                    No venues found
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

        result.data.forEach(venue =>
        {
            html += `
            <tr>

                <td>
                    ${venue.venue_id}
                </td>

                <td>
                    ${venue.venue_name}
                </td>

                <td>
                    ${venue.capacity}
                </td>

                <td class="action-buttons">

                    <button
                    class="edit-btn"
                    onclick="editVenue(
                        ${venue.venue_id},
                        '${venue.venue_name.replace(/'/g, "\\'")}',
                        ${venue.capacity}
                    )">

                    Edit

                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteVenue(
                        ${venue.venue_id}
                    )">

                    Delete

                    </button>

                </td>

            </tr>
            `;
        });

        document.getElementById(
            'venueTable'
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
            'Failed to load venues'
        );
    }
}

/*
=====================================
SAVE VENUE
=====================================
*/

async function saveVenue()
{
    const token =
        localStorage.getItem('token');

    const venueId =
        document.getElementById(
            'venue_id'
        ).value;

    const venueName =
        document.getElementById(
            'venue_name'
        ).value.trim();

    const capacity =
        document.getElementById(
            'capacity'
        ).value;

    if(!venueName || !capacity)
    {
        showMessage(
            'All fields are required'
        );

        return;
    }

    let method = 'POST';

    let body =
    {
        venue_name: venueName,
        capacity: capacity
    };

    if(venueId)
    {
        method = 'PUT';

        body.venue_id = venueId;
    }

    try {

        const response =
            await fetch(
                '../../api/venues.php',
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

        loadVenues();

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
EDIT VENUE
=====================================
*/

function editVenue(
    id,
    name,
    capacity
)
{
    document.getElementById(
        'venue_id'
    ).value = id;

    document.getElementById(
        'venue_name'
    ).value = name;

    document.getElementById(
        'capacity'
    ).value = capacity;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/*
=====================================
DELETE VENUE
=====================================
*/

async function deleteVenue(id)
{
    if(
        !confirm(
            'Delete this venue?'
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
                '../../api/venues.php',
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
                        venue_id: id
                    })
                }
            );

        const result =
            await response.json();

        showMessage(
            result.message
        );

        loadVenues();

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
        'venue_id'
    ).value = '';

    document.getElementById(
        'venue_name'
    ).value = '';

    document.getElementById(
        'capacity'
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

    loadVenues();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadVenues();
    }
}