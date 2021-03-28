$(window).on('load', () => {
    const socket = io();
    $('#myList a').on('click', function (e) {
        $(this).tab('show')
    });
    $('.delete-post').on('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit('delete', $(e.target).data('id'))
                Swal.fire(
                    'Deleted!',
                    'Your post has been deleted.',
                    'success'
                ).then(() => {
                    setTimeout(() => {
                        location.href = "";
                    }, 400);
                });
            }
        })
    })
});