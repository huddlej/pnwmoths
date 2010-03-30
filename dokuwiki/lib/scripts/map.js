var map, mgr;

jQuery(document).ready(function () {
    var species = jQuery("#species").hide().text();

    jQuery.getJSON(
        "http://localhost/~huddlej/service.php",
        {
            "method": "getMap",
            "species": species
        },
        function (data, textStatus) {
            return new Map(data);
        }
    );

    data = [
         {lat: 46.90,
          lng: -118.00,
          info: "<p>Hey, I'm some info!!!</p>"},
         {lat: 47.0,
          lng: -118.5,
          info: "<p>Oh hai, I'm also info.</p>"}
    ];
    //return new Map(data);
});

function Map(data) {
    var markers = [],
        point;

    if (!GBrowserIsCompatible()) {
        jQuery("#googlemap").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
        return;
    }

    map = new GMap2(jQuery("#googlemap").get(0));

    // Center on Washington State.
    map.setCenter(new GLatLng(46.90, -118.00), 5);
    map.addControl(new GLargeMapControl());
    map.addControl(new GMapTypeControl());
    map.addMapType(G_PHYSICAL_MAP);
    map.setMapType(G_PHYSICAL_MAP);

    // Build a list of markers for the given data.
    for (var i = 0; i < data.length; i++) {
        point = new GLatLng(data[i].lat, data[i].lng);
        markers.push(createMarker(point, i, data[i].info, {}));
    }

    // Use the marker manager to add multiple markers simulataneously and set
    // the maximum and minimum zoom levels at which the markers should be
    // displayed.
    mgr = new MarkerManager(map);
    mgr.addMarkers(markers, 3, 10);
    mgr.refresh();
}

function createMarker(point, number, html, marker_options) {
    var marker = new GMarker(point, marker_options);
    marker.value = number;
    GEvent.addListener(marker, "click", function() {
        map.openInfoWindowHtml(point, html);
    });

    return marker;
}
