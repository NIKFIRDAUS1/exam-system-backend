let currentPage = 1;

const limit = 5;

loadUsers();

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
LOAD USERS
=====================================
*/

async function loadUsers()
{
    const token =
        localStorage.getItem('token');

    const currentUser =
        JSON.parse(
            atob(
                token.split('.')[1]
            )
        );

    const currentUserId =
        currentUser.user_id;

    const search =
        document.getElementById('search')
        ? document.getElementById('search').value
        : '';

    let url =
        `../../api/users.php?page=${currentPage}&limit=${limit}`;

    if(search)
    {
        url +=
            '&search=' +
            encodeURIComponent(search);
    }

    document.getElementById(
        'userTable'
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

        /*
        PAGINATION BUTTONS
        */

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

        /*
        NO DATA
        */

        if(result.data.length === 0)
        {
            document.getElementById(
                'userTable'
            ).innerHTML =
            `
            <tr>
                <td colspan="5">
                    No users found
                </td>
            </tr>
            `;

            return;
        }

        /*
        BUILD TABLE
        */

        let html = '';

        result.data.forEach(user =>
        {
            html += `
            <tr>

                <td>
                    ${user.user_id}
                </td>

                <td>
                    ${user.full_name}
                </td>

                <td>
                    ${user.email}
                </td>

                <td>

                    <span
                    class="
                    role-badge
                    role-${user.role}
                    ">

                    ${user.role}

                    </span>

                </td>

                <td class="action-buttons">

                    <button
                    class="edit-btn"
                    onclick="editUser(
                        ${user.user_id},
                        '${user.full_name.replace(/'/g, "\\'")}',
                        '${user.email}',
                        '${user.role}'
                    )">

                    Edit

                    </button>

                    ${
                        user.user_id != currentUserId
                        ?
                        `
                        <button
                        class="delete-btn"
                        onclick="deleteUser(
                            ${user.user_id}
                        )">

                        Delete

                        </button>
                        `
                        :
                        `
                        <span
                        style="
                        color:#C62828;
                        font-weight:bold;
                        ">

                        Current User

                        </span>
                        `
                    }

                </td>

            </tr>
            `;
        });

        document.getElementById(
            'userTable'
        ).innerHTML =
        html;

    }
    catch(error)
    {
        console.error(error);

        showMessage(
            'Failed to load users'
        );
    }
}

/*
=====================================
SAVE USER
=====================================
*/

async function saveUser()
{
    const token =
        localStorage.getItem('token');

    const userId =
        document.getElementById(
            'user_id'
        ).value;

    const fullName =
        document.getElementById(
            'full_name'
        ).value.trim();

    const email =
        document.getElementById(
            'email'
        ).value.trim();

    const password =
        document.getElementById(
            'password'
        ).value;

    const role =
        document.getElementById(
            'role'
        ).value;

    if(
        !fullName ||
        !email ||
        !role
    )
    {
        showMessage(
            'All fields are required'
        );

        return;
    }

    if(
        !userId &&
        !password
    )
    {
        showMessage(
            'Password is required'
        );

        return;
    }

    let method = 'POST';

    let body =
    {
        full_name: fullName,
        email: email,
        password: password,
        role: role
    };

    if(userId)
    {
        method = 'PUT';

        body =
        {
            user_id: userId,
            full_name: fullName,
            email: email,
            role: role
        };
    }

    try {

        const response =
            await fetch(
                '../../api/users.php',
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

        loadUsers();

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
EDIT USER
=====================================
*/

function editUser(
    id,
    fullName,
    email,
    role
)
{
    document.getElementById(
        'user_id'
    ).value = id;

    document.getElementById(
        'full_name'
    ).value = fullName;

    document.getElementById(
        'email'
    ).value = email;

    document.getElementById(
        'role'
    ).value = role;

    document.getElementById(
        'password'
    ).value = '';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/*
=====================================
DELETE USER
=====================================
*/

async function deleteUser(id)
{
    if(
        !confirm(
            'Delete this user?'
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
                '../../api/users.php',
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
                        user_id: id
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

        loadUsers();

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
        'full_name'
    ).value = '';

    document.getElementById(
        'email'
    ).value = '';

    document.getElementById(
        'password'
    ).value = '';

    document.getElementById(
        'role'
    ).value = 'student';

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

    loadUsers();
}

function previousPage()
{
    if(currentPage > 1)
    {
        currentPage--;

        loadUsers();
    }
}