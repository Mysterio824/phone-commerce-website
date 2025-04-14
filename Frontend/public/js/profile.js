function goBack(event) {
    event.preventDefault();
    $('#ChangeInfor').css('display', 'none');
    $('#secondCard').css('display', 'block');
}

function showChangeInfo() {
    $('#secondCard').css('display', 'none');
    $('#ChangeInfor').css('display', 'block');
}

function goBack2(event) {
    event.preventDefault();
    $('#ChangePass').css('display', 'none');
    $('#secondCard').css('display', 'block');
}

function showChangePass() {
    $('#secondCard').css('display', 'none');
    $('#ChangePass').css('display', 'block');
}

async function changeInfor(event) {
    event.preventDefault();
    const status = await updateDetail(event);
    if (status) {
        $('#ChangeInfor').css('display', 'none');
        $('#secondCard').css('display', 'block');
    }
}

async function ChangePass(event) {
    event.preventDefault();
    const status = await updateDetail(event, false);
    if (status) {
        $('#ChangePass').css('display', 'none');
        $('#secondCard').css('display', 'block');
    }
}

async function updateDetail(event, isInfor = true) {
    event.preventDefault();
    try {
        const username = $('#Username');
        const email = $('#Email');
        const oldPassword = $('#oldPassword');
        const newPassword = $('#newPassword');
        const newPassword2 = $('#newPassword2');
        function isEmptyOrNotExist(input) {
            return !input || input.val().trim() === '';
        }

        if (isInfor) {
            if (isEmptyOrNotExist(username)) {
                alert("Invalid Username");
                return false;
            }

            if (isEmptyOrNotExist(email)) {
                alert("Invalid Email");
                return false;
            }

            if (username.val() === user.username && email.val() === user.email) {
                return true;
            }

            const res = await fetch('http://localhost:3000/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, username: username.val(), email: email.val(), isInfor })
            });
            const rs = await res.json();
            if (!res.ok) {
                alert("Error: " + rs.message);
                return false;
            }
            $('#username_label').html(`${rs.editUser.username}`);
            $('#email_label').html(`${rs.editUser.email}`);
        }

        else {
            if (isEmptyOrNotExist(oldPassword)) {
                alert("Your old password can't be empty");
                return false;
            }
            if (isEmptyOrNotExist(newPassword) || isEmptyOrNotExist(newPassword2) || newPassword.val() === oldPassword.val()) {
                alert("Your new password is incorrect");
                return false;
            }
            if (newPassword2.val() !== newPassword.val()) {
                alert("Your new password doesn't match");
                return false;
            }
            const res = await fetch('http://localhost:3000/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, oldPassword: oldPassword.val(), newPassword: newPassword.val(), isInfor })
            });
            const rs = await res.json();
            if (!res.ok) {
                alert("Error: " + rs.message);
                return false;
            }
            oldPassword.val('');
            newPassword.val('');
            newPassword2.val('');
        }

        alert("Update successfully");
        return true;
    } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
        return false;
    }
}