$(window).on('load', () => {
    let socket = io();
    $('#sign-in').click((e) => {
        const validatePhone = (str) => {
            const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            return regex.test(str);
        }
        const phone = $('#phone').val();
        const pass = $('#password').val();
        let error;
        if (!validatePhone(phone))
            error = 'Invalid phone number';
        if (error)
            Swal.fire(
                'Error',
                error,
                'error'
            )
        else
            socket.emit('signin', {
                phoneNumber: phone,
                pass
            }, (success) => {
                if (!success)
                    Swal.fire(
                        'Error',
                        'Your credentials are incorrect, please try again',
                        'error'
                    )
                else
                    location.href = success;
            });
    });
    $('#password, #phone').on('keyup', (e) => {
        if (e.keyCode === 13)
            $('#sign-in').click();
    })
})