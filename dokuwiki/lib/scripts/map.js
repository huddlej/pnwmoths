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
            createMarkers(groupMarkerData(data));
        }
    );
});

function Map() {
    var bottomLeft, bottomRight;

    if (!GBrowserIsCompatible()) {
        jQuery("#googlemap").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
        return;
    }

    map = new GMap2(jQuery("#googlemap").get(0));

    // Center on Washington State.
    map.setCenter(new GLatLng(46.90, -118.00), 5);
    bottomLeft = new GControlPosition(G_ANCHOR_BOTTOM_LEFT,
                                       new GSize(10, 10));
    bottomRight = new GControlPosition(G_ANCHOR_BOTTOM_RIGHT,
                                       new GSize(10, 10));
    map.addControl(new GSmallMapControl(), bottomLeft);
    map.addControl(new GMapTypeControl(), bottomRight);
    map.addMapType(G_PHYSICAL_MAP);
    map.removeMapType(G_NORMAL_MAP);
    map.removeMapType(G_SATELLITE_MAP);
    map.setMapType(G_PHYSICAL_MAP);

    mgr = new MarkerManager(map);

    // Add filters to map container.
    var tabs = jQuery("<div id='tabs'><a href='' id='toggle-filters'>Filters</a> | <a href='' id='toggle-phenology'>Phenology</a></div>");

    map.getContainer().appendChild(tabs.get(0));
    map.getContainer().appendChild(jQuery("#filters").get(0));
    map.getContainer().appendChild(jQuery("#plot").get(0));
}

// Group marker data by latitude and longitude values.
function groupMarkerData(data) {
    var groupedData = {},
        i,
        j,
        attributes = ["latitude", "longitude", "site_name", "county", "state", "elevation"],
        key,
        attribute;

    for (i in data) {
        if (data.hasOwnProperty(i)) {
            key = [data[i].latitude, data[i].longitude];

            // Create an entry for this record's latitude and longitude if one
            // doesn't exist yet.
            if (groupedData.hasOwnProperty(key) === false) {
                groupedData[key] = {};
            }

            // Get the first non-empty value for each attribute associated with
            // this latitude/longitude pair.
            for (j in attributes) {
                attribute = attributes[j];
                if (groupedData[key].hasOwnProperty(attribute) === false &&
                    typeof(data[i][attribute]) !== 'undefined') {
                    groupedData[key][attribute] = data[i][attribute];
                }
            }

            // Add any collection data available for this record.
            collection = renderCollection(data[i]);
            if (collection !== null) {
                if (groupedData[key].hasOwnProperty("collections") === false) {
                    groupedData[key]["collections"] = [];
                }

                groupedData[key]["collections"].push(collection);
            }
        }
    }

    return groupedData;
}

// Render a date string for a given record.
function renderDate(record) {
    if (record.year && record.month && record.day) {
        return record.month + "/" + record.day + "/" + record.year;
    }
    else if(record.year && record.month)  {
        return record.month + "/" + record.year;
    }
    else if(record.year) {
        return record.year;
    }
    else {
        return "";
    }
}

// Render all collection related information for a given record.
function renderCollection(record) {
    // Set the date for this marker.
    var summary = renderDate(record);
    if (summary != "") {
        if (record.collector) {
            summary += " by " + record.collector;

            if (record.number_of_males) {
                summary += ", " + record.number_of_males + " males";
            }

            if (record.number_of_females) {
                summary += ", " + record.number_of_females + " females";
            }

            if (record.collection) {
                summary += " (" + record.collection + ")";
            }
        }

        return summary;
    }

    return null;
}

// Render one marker data record to an array of HTML for the marker info window
// tabs.
function renderMarkerRecord(record) {
    var attributes = {"site_name": "Site Name",
                      "county": "Country",
                      "state": "State",
                      "elevation": "Elevation"},
        html = "<div class='infowindow'>",
        attribute, attribute_name, attribute_value;

    for (attribute in attributes) {
        if (attributes.hasOwnProperty(attribute)) {
            attribute_name = attributes[attribute];
            if (record[attribute]) {
                attribute_value = record[attribute];
            }
            else {
                attribute_value = "";
            }
            html += "<p>" + attribute_name + ": " + attribute_value + "</p>";
        }
    }

    html += "</div>";
    return html;
}

function createMarkers(data) {
    var markers = [],
        point,
        i;

    // Always clear the current marker set before adding new markers.
    mgr.clearMarkers();

    // Build a list of markers for the given data. Data is indexed by a
    // latitude/longitude tuple so i[0] is latitude and i[1] is longitude.
    for (i in data) {
        if (data.hasOwnProperty(i)) {
            point = new GLatLng(data[i].latitude, data[i].longitude);
            markers.push(createMarker(point, i, renderMarkerRecord(data[i]), {}));
        }
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
