let events = [];
var activeInfoWindow;
$(window).on('load', () => {
    const notyf = new Notyf({
        types: [
            {
                type: 'info',
                background: 'rgb(255,165,0, 0.89)',
                icon: false
            }
        ]
    });
    const addMarker = (event) => {
        console.log(event);
        const contentString =
            '<div class="infoWindowContent">' +
            '<div class="leftHalfInfoWindow">' +
            '<h2 class="infoWindowHeading centerText">' + event.title + '</h2>' +
            '<div>' +
            '<p class="centerText">' + 
            event.description
            +
            '</p>' +
            '<hr class="solid">' +
            '<p class="centerText">' +
            event.address +
            '</p>' +
            '<p class="centerText">' +
            event.dateFormatted +
            '</p>' +
            '</div>' +
            '</div>' +
            '<div class="rightHalfInfoWindow">' +
            '<div>' +
            '<img class="infoWindowImg openGallery" data-gallery="' + encodeURIComponent(JSON.stringify(event.mediaURLS)) + '" src="' + event.mediaURLS[0] + '" />' +
            '</div>' +
            '</div>' +
            '</div>';
        const infowindow = new google.maps.InfoWindow({
            content: contentString,
        });
        let markerURL;

        if (event.type.toUpperCase() === 'EMERGENCY') {
            markerURL = "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        }
        else if (event.type.toUpperCase()  === 'INFO') {
            markerURL = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
        else if (event.type.toUpperCase()  === 'RESOURCE') {
            markerURL = "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        }
        const marker = new google.maps.Marker({
            position: { lat: event.lat, lng: event.long },
            map,
            title: event.title,
            icon: markerURL
        });
        marker.addListener("click", () => {
            if (activeInfoWindow)
                activeInfoWindow.close();
            infowindow.open(map, marker);
            activeInfoWindow = infowindow;
        });
    }


    const socket = io();
    socket.on('events', (_events) => {
        events = _events;
        for (i in events)
            addMarker(events[i]);
    });
    socket.on('event', (event) => {
        notyf.open({
            type: 'info',
            message: 'Event reported at <address>'
        });
        events.push(event);
        addMarker(event);
    });
    const SanAntonio = { lat: 29.424349, lng: -98.4936 };
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: SanAntonio,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.business",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }
        ]
    });
    $('body').on('click', '.openGallery', (e) => {
        const items = [];
        const mediaURLS = JSON.parse(decodeURIComponent($(e.target).attr('data-gallery')));
        const galleryItems = [];
        for (i in mediaURLS) {
            const url = mediaURLS[i];
            const type = url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('/')+4);
            galleryItems.push({
                src: url,
                type: type === 'vid' ? 'iframe' : undefined
            });
        }
        $(e.target).magnificPopup({
            removalDelay: 300,
            items: galleryItems,
            mainClass: 'mfp-fade',
            gallery: {
                enabled: true
            },
            type: 'image' // this is default type
        }).magnificPopup('open');
        e.preventDefault();
        e.stopPropagation();
        return false;
    }).on('contextmenu', (e) => {
        if (activeInfoWindow) {
            activeInfoWindow.close();
            activeInfoWindow = null;
        }

    });

})