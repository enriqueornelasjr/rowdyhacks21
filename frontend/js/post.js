function Media(data) {
    this.file = data.file;
    this.url = data.url;
    this.type = data.type;
}

let medias = [];
let currInd = 0;
$(window).on('load', () => {
    const socket = io();
    $('#add-media').click(() => {
        $('#media-form').click();
    });
    $('#clear-media').click(() => {
        medias = [];
        currInd = 0;
        $('#medias-preview').html('');
    });
    $('body').on('click', '.img-thumb', (e) => {
        const ind = $(e.target).data('ind');
        $(e.target).magnificPopup({
            removalDelay: 300,
            items: {
                src: medias[ind].url
            },
            mainClass: 'mfp-fade',
            type: medias[ind].type === 'video' ? 'iframe' : medias[ind].type
        }).magnificPopup('open');
    });
    $('#media-form').change((e) => {
        const files = e.target.files;
        if (files.length > 0) {
            for (i = 0; i < files.length; i++) {
                const file = files[i];
                const type = file.type.toLowerCase().indexOf('vid') > -1 ? 'video' : 'image';
                const html = `
                <li class='list-group-item d-flex justify-content-between lh-condensed'>
                    <div>
                        <h6 class='my-0'>${file.name}</h6>
                    </div>
                    <span class='text-muted'>
                        <img class='img-thumb' data-ind="${currInd}" 
                            src="${type === 'image' ? window.URL.createObjectURL(file) : '../img/play-button.png'}" />
                    </span>
                </li>`;
                medias.push({
                    file: file,
                    type: type,
                    url: window.URL.createObjectURL(file)
                });
                currInd++;
                $('#medias-preview').append(html);
            }
            $(e.target).val('');
        }
    });
    $("#post-btn").click(() => {
        const name = $('#name').val();
        const type = $('#type').val();
        const description = $('#description').val();
        const address = $('#address').val();
        const address2 = $('#address2').val();
        const country = $('#country').val();
        const state = $('#state').val();
        const zip = $('#zip').val();
        const data = {
            event: {
                name,
                type,
                description,
                address: address2 !== '' ? address + '\n' + address2 : address,
                country,
                state,
                zip
            },
            media: medias
        }
        const formData = new FormData();
        medias.forEach((val, ind) => {
            const type = val.type === 'video' ? 'vid' : 'img'
            formData.append(type+'_'+ind, val.file);
        })
        formData.append('event', JSON.stringify(data.event));
        console.log(formData)
        $.ajax({
            type: "POST",
            url: '/upload',
            data: formData,
            contentType: false,
            success: () => {
                alert('submitted :D')
            },
            processData: false,
        });
    });
});