var map,
    mgr,
    species,
    data,
    filters = {},
    icons;

jQuery(document).ready(function () {
    var newmap = new Map(),
        optionFilters = [["county", "getCounties"],
                         ["state", "getStates"]],
        i, j;
    species = jQuery("#species").hide().text();

    // Setup custom events "requestData" and "dataIsReady". The latter initiates
    // a request to the data service passing any filters that have been
    // set. When the data is ready, the "dataIsReady" event is triggered.
    jQuery(document).bind("requestData", function (event) {
        // Fade out temporarily to let the user see the effects of their
        // filters.
        if (jQuery("#filters").css("display") != "none") {
            jQuery("#filters").fadeTo(10, 0.3).fadeTo(5000, 1);
        }
        getSpeciesData(species, filters);
    });
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

    // Close filter window
    jQuery("#filters-close").click(
        function (event) {
            event.preventDefault();
            jQuery("#filters").hide();
        }
    );

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

    // County
    jQuery("#form-county").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#county").val();
            filters["county"] = start;
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#clear-filter-county").click(
        function (event) {
            event.preventDefault();
            if (filters.hasOwnProperty("county")) {
                delete filters["county"];
                jQuery(this).siblings("select").val("");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // State
    jQuery("#form-state").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#state").val();
            filters["state"] = start;
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#clear-filter-state").click(
        function (event) {
            event.preventDefault();
            if (filters.hasOwnProperty("state")) {
                delete filters["state"];
                jQuery(this).siblings("select").val("");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // Setup option filters (those with select fields).
    var requestData = {};
    for (i = 0; i < optionFilters.length; i++) {
        var optionFilter = optionFilters[i];
        requestData["method"] = optionFilter[1];
        getData(requestData, buildOptionFilterCallback(optionFilter));
    }

    // Trigger the initial request for data.
    if (species) {
        jQuery(document).trigger("requestData");
    }
});

// Builds the callback function for each option filter.
function buildOptionFilterCallback(optionFilter) {
    return function (new_data) {
        var select = jQuery("#" + optionFilter[0]),
            option;
        for (j in new_data) {
            if (new_data.hasOwnProperty(j)) {
                option = jQuery("<option></option>");
                option.val(new_data[j]);
                option.text(new_data[j]);
                select.append(option);
            }
        }
    };
}

// Requests data from the data service for the given species and filtering by
// the given filters. Filtering takes place on the server before the data is
// returned.
function getSpeciesData(species, filters) {
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

    return getData(
         requestData,
         function (new_data, textStatus) {
            // Update global data variable.
            data = new_data;

            // Trigger "data is ready" event.
            jQuery(document).trigger("dataIsReady");
        }
    );
}

function getData(requestData, callback) {
    // TODO: need a configuration option for the service address or the host
    // address.
    jQuery.getJSON(
        "http://localhost/~huddlej/service.php",
        requestData,
        callback
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
    plotDiv.show();
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
    var mapDiv;

    if (!GBrowserIsCompatible()) {
        jQuery("#googlemap").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
        return;
    }

    mapDiv = jQuery("#googlemap");
    mapDiv.show();
    map = new GMap2(mapDiv.get(0));

    // Center on Washington State.
    map.setCenter(new GLatLng(46.90, -118.00), 5);
    map.addControl(new GSmallMapControl());
    map.addControl(new GMapTypeControl());
    map.addControl(new FiltersControl());
    map.addMapType(G_PHYSICAL_MAP);
    map.removeMapType(G_NORMAL_MAP);
    map.removeMapType(G_SATELLITE_MAP);
    map.setMapType(G_PHYSICAL_MAP);
    addTerritoryBoundaries();

    geo_xml = new GGeoXml("http://www.biol.wwu.edu/~huddlej/pnwmoths/counties9.kml");
    map.addOverlay(geo_xml);

    icons = buildMapIcons();
    mgr = new MarkerManager(map);

    // Add filters to map container.
    map.getContainer().appendChild(jQuery("#filters").get(0));
}

// Group marker data by latitude and longitude values.
function groupMarkerData(data) {
    var groupedData = {},
        i, j, key,
        attribute,
        collection,
        attributes = [
            "latitude",
            "longitude",
            "site_name",
            "county",
            "state",
            "elevation",
            "precision"
        ];

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
        collectionHtml += "<th><a href='/dokuwiki/doku.php?id=factsheets:collection_glossary' target='_new'>Site</a></th>";
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
            markers.push(createMarker(point, i, renderMarkerRecord(data[i]),
                                      {icon: icons[data[i].precision - 1]}));
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

function buildMapIcons() {
    var simpleIcon, iconColors, imagePath, i, icons;

    // Icon code generated by
    // http://www.powerhut.co.uk/googlemaps/custom_markers.php
    // using seed icons generated by Google's Chart API:
    // http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|CCCCCC|000000
    // where "CCCCCC" can be replaced by the color hex code you want.
    simpleIcon = new GIcon(G_DEFAULT_ICON);
    simpleIcon = new GIcon();
    simpleIcon.iconSize = new GSize(21,34);
    simpleIcon.shadowSize = new GSize(38,34);
    simpleIcon.iconAnchor = new GPoint(11,34);
    simpleIcon.infoWindowAnchor = new GPoint(11,0);
    simpleIcon.imageMap = [13,0,15,1,16,2,17,3,18,4,19,5,19,6,19,7,20,8,20,9,20,10,20,11,19,12,19,13,19,14,18,15,17,16,16,17,16,18,15,19,14,20,14,21,13,22,13,23,13,24,12,25,12,26,12,27,12,28,11,29,11,30,11,31,11,32,11,33,9,33,9,32,9,31,9,30,9,29,9,28,8,27,8,26,8,25,8,24,7,23,7,22,6,21,6,20,5,19,4,18,4,17,3,16,2,15,1,14,1,13,1,12,0,11,0,10,0,9,0,8,1,7,1,6,1,5,2,4,3,3,4,2,5,1,7,0];

    // Icon color darkness is proportional to the precision of the
    // latitude/longitude values used for the marker. Thus, a precision of 0 has
    // the lightest grey icon while a precision of 4 would have a much darker
    // grey icon.
    iconColors = ["e5e5e5", "cccccc", "999999", "000000"];
    imagePath = "/~huddlej/images/markers/";
    icons = [];
    for (i in iconColors) {
        if (iconColors.hasOwnProperty(i)) {
            var icon = new GIcon(simpleIcon);
            icon.image = imagePath + iconColors[i] + "/image.png";
            icon.printImage = imagePath + iconColors[i] + "/printImage.gif";
            icon.mozPrintImage = imagePath + iconColors[i] + "/mozPrintImage.gif";
            icon.shadow = imagePath + iconColors[i] + "/shadow.png";
            icon.transparent = imagePath + iconColors[i] + "/transparent.png";
            icon.printShadow = imagePath + iconColors[i] + "/printShadow.gif";
            icons.push(icon);
        }
    }

    return icons;
}

function addTerritoryBoundaries() {
  // Place a polygon around the area we're most interested in.
  var polygon = new GPolygon([
        new GLatLng(40, -109.5),
        new GLatLng(53, -109.5),
        new GLatLng(53, -126),
        new GLatLng(40, -126),
        new GLatLng(40, -109.5)
  ], "#0099ff", 1, 1, "#ccffff", 0.2);
  map.addOverlay(polygon);
}