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

     var div = jQuery("#filters");
     div.css("background-color", "#ccc");
     div.css("position", "relative");

    jQuery("#toggle-filters").click(
        function (event) {
            event.preventDefault();
            div.toggle();
        }
    );
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
    map.addControl(new GSmallMapControl());
    map.addControl(new GMapTypeControl());
    map.addMapType(G_PHYSICAL_MAP);
    map.setMapType(G_PHYSICAL_MAP);

    // Add filters to map container.
    map.getContainer().appendChild(jQuery("#filters").get(0));

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
