var map, mgr;

jQuery(document).ready(function () {
    var species = jQuery("#species").hide().text(),
        newmap = new Map();

    var filters = jQuery("#filters");
    jQuery("#toggle-filters").click(
        function (event) {
            event.preventDefault();
            filters.siblings(".tab").hide();
            filters.toggle();
        }
    );

    var phenology = jQuery("#plot");
    jQuery("#toggle-phenology").click(
        function (event) {
            event.preventDefault()
            phenology.siblings(".tab").hide();
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
    var filtersTab = jQuery("<div><a href='' id='toggle-filters'>Filters</a></div>");
    filtersTab.css("background-color", "beige");
    filtersTab.css("position", "relative");
    filtersTab.css("width", "80px");

    var phenologyTab = jQuery("<div><a href='' id='toggle-phenology'>Phenology</a></div>");
    phenologyTab.css("background-color", "beige");
    phenologyTab.css("position", "relative");
    phenologyTab.css("width", "80px");

    map.getContainer().appendChild(filtersTab.get(0));
    map.getContainer().appendChild(phenologyTab.get(0));
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
