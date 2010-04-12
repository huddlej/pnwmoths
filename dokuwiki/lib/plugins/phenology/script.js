var map,
    mgr,
    species,
    data,
    filters = {};

jQuery(document).ready(function () {
    var newmap = new Map();
    species = jQuery("#species").hide().text();

    // Setup custom events "requestData" and "dataIsReady". The latter initiates
    // a request to the data service passing any filters that have been
    // set. When the data is ready, the "dataIsReady" event is triggered.
    jQuery(document).bind("requestData", function (event) { getData(species, filters); });
    jQuery(document).bind("dataIsReady", preparePhenologyData);
    jQuery(document).bind(
        "dataIsReady",
        function (event) {
            createMarkers(groupMarkerData(data));
        }
    );

    //
    // Setup filters.
    //

    // All filters
    jQuery("#clear-filters").click(
        function (event) {
            event.preventDefault();
            filters = {};
            jQuery("#filters input:text").val("");
            jQuery(document).trigger("requestData");
        }
    );

    // Elevation
    jQuery("#form-elevation").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#startelevation").val(),
                end = jQuery("#endelevation").val();
            filters["elevation"] = [start, end];
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#clear-filter-elevation").click(
        function (event) {
            event.preventDefault();
            if (filters.hasOwnProperty("elevation")) {
                delete filters["elevation"];
                jQuery(this).siblings("input:text").val("");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // Date
    jQuery("#form-date").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#startdate").val(),
                end = jQuery("#enddate").val();
            filters["date"] = [start, end];
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#clear-filter-date").click(
        function (event) {
            event.preventDefault();
            if (filters.hasOwnProperty("date")) {
                delete filters["date"];
                jQuery(this).siblings("input:text").val("");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // Trigger the initial request for data.
    jQuery(document).trigger("requestData");
});

// Requests data from the data service for the given species and filtering by
// the given filters. Filtering takes place on the server before the data is
// returned.
function getData(species, filters) {
    var key,
        requestData = {
            "method": "getSamples",
            "species": species
        };

    // Add filter values to the request data.
    for (key in filters) {
        if (filters.hasOwnProperty(key)) {
           requestData[key] = filters[key];
        }
    }

    jQuery.getJSON(
        "http://localhost/~huddlej/service.php",
        requestData,
        function (new_data, textStatus) {
            // Update global data variable.
            data = new_data;

            // Trigger "data is ready" event.
            jQuery(document).trigger("dataIsReady");
        }
    );
}

function preparePhenologyData(event) {
    var phenologyData = [],
        startInterval = 0,
        endInterval = 12,
        i,
        plot;

    // Pre-populate samples by interval with zeros.
    for (i = startInterval; i < endInterval; i++) {
        phenologyData[i] = 0;
    }

    // Map sample data to the given interval by counting each sample
    // that matches an interval marker.
    for (i in data) {
        if (data.hasOwnProperty(i) && data[i].month) {
            phenologyData[parseInt(data[i].month) - 1] += 1;
        }
    }

    // jqPlot requires the placeholder div to be visible in the DOM when
    // the plot is created. Each time a new plot is generated the div
    // needs to be emptied and shown. After the plot is generated, the
    // div can be hidden again.
    plotDiv = jQuery("#plot");
    plotDiv.empty();
    plot = new Phenology(species, phenologyData);
}

function Phenology (species, data) {
    // Return a new jqPlot. This mostly consists of a lot of jqPlot options.
    return jQuery.jqplot(
        "plot",
        [data],
        {
            seriesDefaults: {
                renderer: jQuery.jqplot.BarRenderer,
                rendererOptions: {shadowAlpha: 0, barWidth: 5}
            },
            grid: {drawGridlines: false},
            title: "Flight Season",
            axes: {
                xaxis: {
                    label: 'Month',
                    renderer: jQuery.jqplot.CategoryAxisRenderer,
                    labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                    ticks: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
                },
                yaxis: {
                    label: 'Number of Records',
                    labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                    min: 0,
                    tickOptions: {formatString: '%i'},
                    showTickMarks: false
                }
            }
        }
    );
};

//
// Setup a custom Google map control for toggling the display of the filters.
//
function FiltersControl() {
}
FiltersControl.prototype = new GControl();
FiltersControl.prototype.initialize = function (map) {
    var container = document.createElement("div"),
        filterDiv = document.createElement("div");

    this.setButtonStyle_(filterDiv);
    container.appendChild(filterDiv);
    filterDiv.appendChild(document.createTextNode("Filters"));
    GEvent.addDomListener(
        filterDiv,
        "click",
        function () {
            jQuery("#filters").toggle();
        }
    );

    map.getContainer().appendChild(container);
    return container;
};
// Sets the proper CSS for the given button element.
FiltersControl.prototype.setButtonStyle_ = function (button) {
    button.style.backgroundColor = "white";
    button.style.font = "small Arial";
    button.style.border = "1px solid black";
    button.style.padding = "2px";
    button.style.marginBottom = "3px";
    button.style.textAlign = "center";
    button.style.width = "5em";
    button.style.cursor = "pointer";
};
FiltersControl.prototype.getDefaultPosition = function() {
    return new GControlPosition(G_ANCHOR_BOTTOM_LEFT, new GSize(7, 7));
};

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
    map.addControl(new FiltersControl());
    map.addMapType(G_PHYSICAL_MAP);
    map.removeMapType(G_NORMAL_MAP);
    map.removeMapType(G_SATELLITE_MAP);
    map.setMapType(G_PHYSICAL_MAP);

    mgr = new MarkerManager(map);

    // Add filters to map container.
    map.getContainer().appendChild(jQuery("#filters").get(0));
}

// Group marker data by latitude and longitude values.
function groupMarkerData(data) {
    var groupedData = {},
        i,
        j,
        attributes = ["latitude", "longitude", "site_name", "county", "state", "elevation"],
        key,
        attribute, collection;

    for (i in data) {
        if (data.hasOwnProperty(i)) {
            key = [data[i].latitude, data[i].longitude];

            // Create an entry for this record's latitude and longitude if one
            // doesn't exist yet.
            if (typeof(groupedData[key]) === "undefined") {
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
            if (typeof(groupedData[key]["collections"]) === "undefined") {
                groupedData[key]["collections"] = [];
            }

            collection = renderCollection(data[i]);
            if (collection !== null) {
                groupedData[key]["collections"].push(collection);
            }
        }
    }

    return groupedData;
}

// Render a date string for a given record.
function renderDate(record) {
    var month_choices = ["Jan", "Feb", "Mar", "Apr",
                         "May", "Jun", "Jul", "Aug",
                         "Sep", "Oct", "Nov", "Dec"];

    if (record.year && record.month && record.day) {
        return month_choices[record.month - 1] + " " + record.day + " " + record.year;
    }
    else if(record.year && record.month)  {
        return month_choices[record.month - 1] + " " + record.year;
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
    var date = renderDate(record);
    if (date != "") {
        return [date, record.collector, record.collection];
    }

    return null;
}

// Render one marker data record to an array of HTML for the marker info window
// tabs.
function renderMarkerRecord(record) {
    var attributes = {"site_name": "Site Name",
                      "county": "County",
                      "state": "State",
                      "elevation": "Elevation (ft.)"},
        pointHtml = "<div class='infowindow'>",
        collectionHtml = "",
        attribute, attribute_name, attribute_value, i, j;

    for (attribute in attributes) {
        if (attributes.hasOwnProperty(attribute)) {
            attribute_name = attributes[attribute];
            if (record[attribute]) {
                attribute_value = record[attribute];
            }
            else {
                attribute_value = "";
            }
            pointHtml += "<p>" + attribute_name + ": " + attribute_value + "</p>";
        }
    }

    pointHtml += "</div>";

    if (record.hasOwnProperty("collections") && record.collections.length > 0) {
        collectionHtml = "<div class='infowindow collections'>";
        collectionHtml += "<table>";
        collectionHtml += "<tr><th>Date</th><th>Collector</th>";
        collectionHtml += "<th><a href='http://localhost/dokuwiki/doku.php?id=factsheets:collection_glossary' target='_new'>Site</a></th>";
        for (i in record.collections) {
            if (record.collections.hasOwnProperty(i)) {
                collectionHtml += "<tr>";
                for (j in record.collections[i]) {
                    collectionHtml += "<td>" + record.collections[i][j] + "</td>";
                }
                collectionHtml += "</tr>";
            }
        }
        collectionHtml += "</table>";
        collectionHtml += "</div>";
    }

    return [pointHtml, collectionHtml];
}

// Creates markers for a given set of data for which each record has a
// "latitude" and "longitude" attribute. Clears any previously existing markers
// from the map before displaying these markers.
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

// Creates a map marker for a given Google map Point instance. The given number
// is used to distinguish this marker from all other markers. The marker uses a
// tabbed info window, so the given HTML is split into one part for each of the
// (two) tabs.
function createMarker(point, number, html, marker_options) {
    var marker = new GMarker(point, marker_options);
    marker.value = number;
    GEvent.addListener(marker, "click", function() {
        // TODO: this code could be more reuseable if it looped through the
        // "html" variable and created a tab for each entry with the tab name in
        // the variable.
        marker.openInfoWindowTabsHtml([new GInfoWindowTab("Site", html[0]),
                                       new GInfoWindowTab("Collections", html[1])]);
    });

    return marker;
}
