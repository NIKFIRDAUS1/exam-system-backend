document
.getElementById('loginForm')
.addEventListener('submit', loginUser);

async function loginUser(event)
{
    event.preventDefault();

    const loginBtn =
    document.getElementById('loginBtn');

    loginBtn.disabled = true;

    loginBtn.innerText = 'Logging in...';

    const email =
        document.getElementById('email').value;

    const password =
        document.getElementById('password').value;

    try {

        const response =
            await fetch('../api/login.php',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                        'application/json'
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

        const result =
            await response.json();

        if(result.success)
        {
            localStorage.setItem(
                'token',
                result.token
            );

            localStorage.setItem(
                'role',
                result.user.role
            );

            localStorage.setItem(
                'user_id',
                result.user.id
            );

            if(result.user.role === 'admin')
            {
                loginBtn.disabled = false;

                loginBtn.innerText = 'Login';
                window.location.href =
                'admin/dashboard.html';
            }

            else if(
                result.user.role === 'lecturer'
            )
            {
                loginBtn.disabled = false;

                loginBtn.innerText = 'Login';
                window.location.href =
                'lecturer/dashboard.html';
            }

            else
            {

                loginBtn.disabled = false;

                loginBtn.innerText = 'Login';

                window.location.href =
                'student/dashboard.html';
            }
        }

        else
        {
            document.getElementById(
                'message'
            ).innerHTML =
            result.message;
        }

    } catch(error) {

        loginBtn.disabled = false;

        loginBtn.innerText = 'Login';
        document.getElementById(
            'message'
        ).innerHTML =
        error.message;
    }
}