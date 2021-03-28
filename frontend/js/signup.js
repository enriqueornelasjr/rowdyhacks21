$(window).on('load', () => {
    let socket = io();
    $('#sign-up').click(() => {
        const validatePhone = (str) => {
            const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            return regex.test(str);
        }
        const phone = $('#phone').val();
        const password = $('#password1').val();
        const password2 = $('#password2').val();
        let error;
        if (!validatePhone(phone))
            error = 'Invalid phone number';
        else if (password.trim() === '')
            error = 'Password cannot blank';
        else if (password.length < 5)
            error = 'Password must be at least 5 characters';
        else if (password !== password2)
            error = 'Passwords do not match';
        if (error)
            Swal.fire(
                'Error',
                error,
                'error'
            )
        else
            socket.emit('register', {
                phoneNumber: phone, password
            }, (err, page) => {
                if (err)
                    Swal.fire(
                        'Error',
                        err,
                        'error'
                    )
                else
                    location.href = page;
            });
    });
    
    $('#password, #phone').on('keyup', (e) => {
        if (e.keyCode === 13)
            $('#sign-up').click();
    })
})