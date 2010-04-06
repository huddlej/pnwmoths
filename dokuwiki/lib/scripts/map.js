var map, mgr;

jQuery(document).ready(function () {
    var species = jQuery("#species").hide().text(),
        newmap = new Map();

    jQuery("#toggle-filters").click(
        function (event) {
            event.preventDefault();
            jQuery("#filters").toggle(200);
        }
    );

    var phenology = jQuery("#plot");
    phenology.css("background-color", "#fff");
    jQuery("#toggle-phenology").click(
        function (event) {
            event.preventDefault();
            phenology.toggle();
        }
    );

    jQuery(document).bind(
        "dataIsReady",
        function (event) {
            createMarkers(data);
        }
    );
});

function Map() {
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

    mgr = new MarkerManager(map);

    // Add filters to map container.
    map.getContainer().appendChild(jQuery("#filters").get(0));
    map.getContainer().appendChild(jQuery("#plot").get(0));
}

function createMarkers(data) {
    var markers = [],
        point,
        i;

    // Always clear the current marker set before adding new markers.
    mgr.clearMarkers();

    // Build a list of markers for the given data.
    for (i = 0; i < data.length; i++) {
        point = new GLatLng(data[i].latitude, data[i].longitude);
        markers.push(createMarker(point, i, data[i].collection, {}));
    }

    // Use the marker manager to add multiple markers simulataneously and set
    // the maximum and minimum zoom levels at which the markers should be
    // displayed.
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
