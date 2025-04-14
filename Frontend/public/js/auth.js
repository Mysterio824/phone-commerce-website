async function signup(event) {
    event.preventDefault();
    const signupButton = $('#signupButton');
    const username = $('#signupUsername').val();
    const password = $('#signupPassword').val();
    const email = $('#signupEmail').val().trim();
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email.match(regexEmail)) {
        alert("Your Email is invalid.");
        return;
    }

    if (password.length < 6) {
        alert("Passwords invalid.");
        return;
    }

    try {
        signupButton.prop('disabled', true);
        signupButton.html("Submitting...");

        const response = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, username, email }),
        });
        if (response.ok) {
            window.location.href = `/auth/verify/${username}`;
            // $('.cont').removeClass('s--signup');
            // setTimeout(() => {
            //     $('#signupEmail').val('').blur();
            //     $('#signupPassword').val('').blur();
            //     $('#signupUsername').val('').blur();
            // }, 1000);
        } else {
            alert(`Existing Username`);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting the form.');
    } finally {
        signupButton.prop('disabled', false);
        signupButton.html("Submit");
    }
}

async function login(event) {
    event.preventDefault();
    const loginButton = $('#loginButton');
    const Username = $('#loginUsername').val().trim();
    const Password = $('#loginPassword').val();

    if (!Username || Username === "") {
        alert("Invalid username format.");
        return;
    }

    try {
        loginButton.prop('disabled', true);
        loginButton.html("Submitting...");

        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: Username, password: Password })
        });

        if (response.url.includes('/auth')) {
            return alert(`Wrong Password or Username`);
        }

        if (response.redirected) {
            window.location.href = response.url;
        }

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting the form.');
    } finally {
        loginButton.prop('disabled', false);
        loginButton.html("Submit");
    }
}

$('.img__btn').on('click', function () {
    $('.cont').toggleClass('s--signup');
});
