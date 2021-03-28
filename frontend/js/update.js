let long, lat;
$(window).on('load', () => {
    const socket = io();
    $('#current-location').click(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const coords = {
                lat: position.coords.latitude,
                long: position.coords.longitude
            }

            socket.emit('geolocate', coords, (data) => {
                $('#city').val(data.city);
                $('#address').val(data.street);
                $('#zip').val(data.zip);
                $('#state').val(data.state);
                $('#country').val(data.country);
                long = data.long;
                lat = data.lat;
            });
        });

    });

    $("#post-btn").click(() => {
        var form = document.querySelectorAll('form')[0];
        let validity = form.checkValidity();
        form.classList.add('was-validated');
        if (!validity)
            return;
        const name = $('#name').val();
        const type = $('#type').val();
        const description = $('#description').val();
        const address = $('#address').val();
        const address2 = $('#address2').val();
        const country = $('#country').val();
        const state = $('#state').val();
        const city = $('#city').val();
        const zip = $('#zip').val();
        const data = {
            event: {
                postId: postID,
                name,
                type,
                description,
                address: address2 !== '' ? address + '\n' + address2 : address,
                country,
                state,
                city,
                zip,
                long,
                lat
            }
        }
        const formData = new FormData();
        formData.append('event', JSON.stringify(data.event));
        $.ajax({
            type: "POST",
            url: '/update',
            data: formData,
            contentType: false,
            success: () => {
                Swal.fire(
                    'Event Posted',
                    'Thank you! Your event is being updated and will be processed shortly',
                    'success'
                  )
            },
            processData: false,
        });
    });
});