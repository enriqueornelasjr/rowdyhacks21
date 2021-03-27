let events = [];
var activeInfoWindow;
$(window).on('load', () => {
    const addMarker = (event) => {
        const contentString =
            '<div class="infoWindowContent">' +
            '<div class="leftHalfInfoWindow">' +
            '<h1 class="infoWindowHeading centerText">' + event.title + '</h1>' +
            '<div>' +
            '<p class="centerText">' +
            event.description
            +
            '</p>' +
            '</div>' +
            '</div>' +
            '<div class="rightHalfInfoWindow">' +
            '<div>' +
            '<img class="infoWindowImg" src="' + event.mediaURLS[0] + '" />' +
            '</div>' +
            '</div>' +
            '</div>';
        const infowindow = new google.maps.InfoWindow({
            content: contentString,
        });
        let markerURL;

        if (event.type === 'EMERGENCY') {
            markerURL = "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        }
        else if (event.type === 'INFO') {
            markerURL = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
        else if (event.type === 'RESOURCE') {
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

})