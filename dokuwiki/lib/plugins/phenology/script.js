var PNWMOTHS = PNWMOTHS || {};
PNWMOTHS.Map = function () {
    return {
        initialize: function () {
            var mapDiv, map, geo_xml;

            if (typeof(GBrowserIsCompatible) == "undefined" || !GBrowserIsCompatible()) {
                jQuery("#googlemap").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
                return;
            }

            PNWMOTHS.Map.mapCenter = new GLatLng(46.90, -118.00);
            mapDiv = jQuery("#googlemap");
            mapDiv.show();
            map = new GMap2(mapDiv.get(0));

            // Center on Washington State.
            map.setCenter(PNWMOTHS.Map.mapCenter, 5);
            map.addControl(new GSmallMapControl());
            map.addControl(new GMapTypeControl());
            map.addControl(getFiltersControl());
            map.addControl(PNWMOTHS.Map.getFullscreenControl());
            map.addMapType(G_PHYSICAL_MAP);
            map.removeMapType(G_NORMAL_MAP);
            map.removeMapType(G_SATELLITE_MAP);
            map.setMapType(G_PHYSICAL_MAP);

            geo_xml = new GGeoXml("http://www.biol.wwu.edu/~huddlej/pnwmoths/counties9.kml");
            map.addOverlay(geo_xml);

            PNWMOTHS.Map.bounds = PNWMOTHS.Map.addTerritoryBoundaries(map);
            PNWMOTHS.Map.icons = PNWMOTHS.Map.buildMapIcons();
            PNWMOTHS.Map.mgr = new MarkerManager(map);

            // Add filters to map container.
            map.getContainer().appendChild(jQuery("#filters").get(0));

            return map;
        },
        groupMarkerData: function (data) {
            // Group marker data by latitude and longitude values.
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

                    // Create an entry for this record's latitude and longitude
                    // if one doesn't exist yet.
                    if (typeof(groupedData[key]) === "undefined") {
                        groupedData[key] = {};
                    }

                    // Get the first non-empty value for each attribute
                    // associated with this latitude/longitude pair.
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
        },
        getFullscreenControl: function () {
            // Full screen control
            function FullscreenControl() {
            }
            FullscreenControl.prototype = new GControl();
            FullscreenControl.prototype.initialize = function (map) {
                var container = document.createElement("div"),
                    filterDiv = document.createElement("div");

                this.setButtonStyle_(filterDiv);
                container.appendChild(filterDiv);
                filterDiv.appendChild(document.createTextNode("Fullscreen"));
                GEvent.addDomListener(
                    filterDiv,
                    "click",
                    function () {
                        jQuery("#googlemap").trigger("fullscreen");
                    }
                );

                map.getContainer().appendChild(container);
                return container;
            };
            // Sets the proper CSS for the given button element.
            FullscreenControl.prototype.setButtonStyle_ = PNWMOTHS.Map.setButtonStyles;
            FullscreenControl.prototype.getDefaultPosition = function() {
                return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(7, 7));
            };

            return new FullscreenControl();
        },
        renderMarkerRecord: function (record) {
            // Render one marker data record to an array of HTML for the marker
            // info window tabs.
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
                collectionHtml += "<th><a href='/dokuwiki/doku.php?id=factsheets:collection_glossary' target='_new'>Collection</a></th>";
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
        },
        createMarkers: function (data) {
            // Creates markers for a given set of data for which each record has
            // a "latitude" and "longitude" attribute. Clears any previously
            // existing markers from the map before displaying these markers.
            var markers = [],
                point,
                i;

            // First group marker data.
            data = PNWMOTHS.Map.groupMarkerData(data);

            // Always clear the current marker set before adding new markers.
            PNWMOTHS.Map.mgr.clearMarkers();

            // Build a list of markers for the given data. Data is indexed by a
            // latitude/longitude tuple so i[0] is latitude and i[1] is
            // longitude.
            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    point = new GLatLng(data[i].latitude, data[i].longitude);
                    markers.push(
                        PNWMOTHS.Map.createMarker(
                            point,
                            i,
                            PNWMOTHS.Map.renderMarkerRecord(data[i]),
                            {icon: PNWMOTHS.Map.icons[data[i].precision]}
                        )
                    );
                }
            }

            // Use the marker manager to add multiple markers simulataneously
            // and set the maximum and minimum zoom levels at which the markers
            // should be displayed.
            PNWMOTHS.Map.mgr.addMarkers(markers, 3, 10);
            PNWMOTHS.Map.mgr.refresh();
        },
        createMarker: function (point, number, html, marker_options) {
            // Creates a map marker for a given Google map Point instance. The
            // given number is used to distinguish this marker from all other
            // markers. The marker uses a tabbed info window, so the given HTML
            // is split into one part for each of the (two) tabs.
            var marker = new GMarker(point, marker_options);
            marker.value = number;
            GEvent.addListener(marker, "click", function() {
                // TODO: this code could be more reuseable if it looped through
                // the "html" variable and created a tab for each entry with the
                // tab name in the variable.
                marker.openInfoWindowTabsHtml([new GInfoWindowTab("Site", html[0]),
                                               new GInfoWindowTab("Collections", html[1])]);
            });

            return marker;
        },
        buildMapIcons: function () {
            var simpleIcon, iconColors, imagePath, i, icons;

            // Icon code generated by
            // http://www.powerhut.co.uk/googlemaps/custom_markers.php using
            // seed icons generated by Google's Chart API:
            // http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|CCCCCC|000000
            // where "CCCCCC" can be replaced by the color hex code you want.
            simpleIcon = new GIcon();
            simpleIcon.iconSize = new GSize(12, 12);
            simpleIcon.shadowSize = new GSize(18, 12);
            simpleIcon.iconAnchor = new GPoint(6, 12);
            simpleIcon.infoWindowAnchor = new GPoint(6, 0);
            simpleIcon.imageMap = [9,0,10,1,11,2,11,3,11,4,11,5,11,6,11,7,11,8,11,9,10,
                                   10,9,11,2,11,1,10,0,9,0,8,0,7,0,6,0,5,0,4,0,3,1,2,2,
                                   1,3,0];

            // Icon color darkness is proportional to the precision of the
            // latitude/longitude values used for the marker. Thus, a precision
            // of 0 has the lightest grey icon while a precision of 4 would have
            // a much darker grey icon.
            iconColors = ["ffffff", "e5e5e5", "cccccc", "999999", "7f7f7f"];
            imagePath = "/media/images/markers/";
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
        },
        addTerritoryBoundaries: function (map) {
            // Place a polygon around the area we're most interested in.
            var polygon = new GPolygon([
                  new GLatLng(40, -109.5),
                  new GLatLng(53, -109.5),
                  new GLatLng(53, -126),
                  new GLatLng(40, -126),
                  new GLatLng(40, -109.5)
            ], "#000000", 2, 1, "#ffffff", 0);
            map.addOverlay(polygon);

            return polygon.getBounds();
        },
        setButtonStyles: function (button) {
            // Sets the proper CSS for the given button element.
            button.style.backgroundColor = "white";
            button.style.font = "small Arial";
            button.style.border = "1px solid black";
            button.style.padding = "2px";
            button.style.marginBottom = "3px";
            button.style.textAlign = "center";
            button.style.width = "5em";
            button.style.cursor = "pointer";
        }
    };
}();
PNWMOTHS.Chart = function () {
    return {
        initialize: function (data) {
            var phenologyData = [],
                flatPhenologyData = [],
                startInterval = 0,
                endInterval = 12,
                daysPerSegment = 10,
                maxSegments = 2,
                i, j,
                plot,
                month, segment,
                ticks = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
                dataLabels = [],
                tick;

            // Pre-populate samples by interval with zeros.
            for (i = startInterval; i < endInterval; i++) {
                    phenologyData[i] = [];
                // One value per segment per month in the phenology.
                for (j = 0; j <= maxSegments; j++) {
                    phenologyData[i][j] = 0;
                }
            }

            // Map sample data to the given interval by counting each sample
            // that matches an interval marker.
            for (i in data) {
                if (data.hasOwnProperty(i) && data[i].month) {
                    // If a record doesn't have a "day" value, don't use it. It is
                    // better to omit a record than mislead users by defaulting the
                    // record to the beginning of the month or some other similar
                    // strategy.
                    if (data[i].day) {
                        // Records are indexed starting with 0 so all months are shifted
                        // by 1.
                        month = parseInt(data[i].month) - 1;

                        // If a record has a day value, place it in the right segment.
                        segment = Math.floor(parseInt(data[i].day) / daysPerSegment);

                        // The graph will never display more than the max number of
                        // segments, so days 30 and 31 get placed into the last segment.
                        segment = Math.min(segment, maxSegments);

                        // Count the number of records for this month and this segment.
                        phenologyData[month][segment] += 1;
                    }
                }
            }

            // Flatten nested phenology data into a single list.
            for (i in phenologyData) {
                for (j in phenologyData[i]) {
                    flatPhenologyData.push(phenologyData[i][j]);
                }
            }

            // Prepare data for jqPlot by nesting our single data set in a list of data
            // sets.
            flatPhenologyData = [flatPhenologyData];

            // Prepare data labels.

            // Build a sequence of tick values consisting of one month letter and n
            // empty values for all months where n is the number of segments per month
            // in the phenology minus 1. For example: ["J", "", "", "F", "", "",...] for
            // n=3.
            for (tick in ticks) {
                dataLabels.push(ticks[tick]);
                for (i = 0; i <= maxSegments - 1; i++) {
                    dataLabels.push(" ");
                }
            }

            // jqPlot requires the placeholder div to be visible in the DOM when
            // the plot is created. Each time a new plot is generated the div
            // needs to be emptied and shown. After the plot is generated, the
            // div can be hidden again.
            plotDiv = jQuery("#plot");
            plotDiv.empty();
            plotDiv.show();
            return PNWMOTHS.Chart.render(flatPhenologyData, dataLabels);
        },
        render: function (data, dataLabels) {
            // Return a new jqPlot. This mostly consists of a lot of jqPlot
            // options.
            return jQuery.jqplot(
                "plot",
                data,
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
                            ticks: dataLabels
                        },
                        yaxis: {
                            autoscale: true,
                            label: 'Number of Records',
                            labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                            tickOptions: {formatString: '%i'},
                            showTickMarks: false
                        }
                    }
                }
            );
        }
    };
}();
PNWMOTHS.Filters = function () {
    return {
        "filters": {}
    };
}();

jQuery(document).unload(function () {
    if (typeof(GUnload) != "undefined") {
        GUnload();
    }
});

jQuery(document).ready(function () {
    var optionFilters = [["county", "getCounties"],
                         ["state", "getStates"]],
        i, j,
        data_id, data_name;

    PNWMOTHS.Map.map = PNWMOTHS.Map.initialize();
    data_name = "species-data";
    data_id = "#" + data_name;

    jQuery("#googlemap").bind("fullscreen", function () {
        jQuery(this).toggleClass("fullscreen");
        PNWMOTHS.Map.map.checkResize();
        PNWMOTHS.Map.map.setCenter(
            PNWMOTHS.Map.mapCenter,
            PNWMOTHS.Map.map.getBoundsZoomLevel(PNWMOTHS.Map.bounds)
        );
    });

    // TODO: rename event to filterData?
    // Setup custom events "requestData" and "dataIsReady". The latter initiates
    // a request to the data service passing any filters that have been
    // set. When the data is ready, the "dataIsReady" event is triggered.
    jQuery(document).bind("requestData", function (event) {
        // Fade out temporarily to let the user see the effects of their
        // filters.
        // TODO: use is_hidden() method instead of testing for display != none
        if (jQuery("#filters").css("display") != "none") {
            jQuery("#filters").fadeTo(10, 0.3).fadeTo(5000, 1);
        }

        // Filter data locally and let all listeners know the data is ready.
        jQuery(data_id).trigger(
            "dataIsReady",
            [filterData(PNWMOTHS.Data.data[data_name], PNWMOTHS.Filters.filters)]
        );
    });

    jQuery(data_id).bind(
        "dataIsReady",
        function (event, data) {
            PNWMOTHS.Chart.chart = PNWMOTHS.Chart.initialize(data);
        }
    );
    jQuery(data_id).bind(
        "dataIsReady",
        function (event, data) {
            PNWMOTHS.Map.createMarkers(data);
        }
    );

    function getSortableDate(date) {
        var date_pieces = date.split("/");
        return [date_pieces.pop()].concat(date_pieces).join("/");
    }

    //
    // Setup filters.
    //

    // Clear text inputs.
    function clearText() {
        jQuery(this).children("input:text").val("");
    }

    // Clear dropdown inputs.
    function clearSelect() {
        jQuery(this).children("select").val("");
    }

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
            PNWMOTHS.Filters.filters = {};
            jQuery("#filters form").trigger("clear");
            jQuery(document).trigger("requestData");
        }
    );

    // Elevation
    jQuery("#form-elevation").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#startelevation").val(),
                end = jQuery("#endelevation").val();
            PNWMOTHS.Filters.filters["elevation"] = [start, end];
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#form-elevation").bind("clear", clearText);
    jQuery("#clear-filter-elevation").click(
        function (event) {
            event.preventDefault();
            if (PNWMOTHS.Filters.filters.hasOwnProperty("elevation")) {
                delete PNWMOTHS.Filters.filters["elevation"];
                jQuery("#form-elevation").trigger("clear");
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
            PNWMOTHS.Filters.filters["date"] = [getSortableDate(start),
                                                getSortableDate(end)];
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#form-date").bind("clear", clearText);
    jQuery("#clear-filter-date").click(
        function (event) {
            event.preventDefault();
            if (PNWMOTHS.Filters.filters.hasOwnProperty("date")) {
                delete PNWMOTHS.Filters.filters["date"];
                jQuery("#form-date").trigger("clear");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // County
    jQuery("#form-county").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#county").val();
            PNWMOTHS.Filters.filters["county"] = start;
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#form-county").bind("clear", clearSelect);
    jQuery("#clear-filter-county").click(
        function (event) {
            event.preventDefault();
            if (PNWMOTHS.Filters.filters.hasOwnProperty("county")) {
                delete PNWMOTHS.Filters.filters["county"];
                jQuery("#form-county").trigger("clear");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // State
    jQuery("#form-state").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#state").val();
            PNWMOTHS.Filters.filters["state"] = start;
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#form-state").bind("clear", clearSelect);
    jQuery("#clear-filter-state").click(
        function (event) {
            event.preventDefault();
            if (PNWMOTHS.Filters.filters.hasOwnProperty("state")) {
                delete PNWMOTHS.Filters.filters["state"];
                jQuery("#form-state").trigger("clear");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // Setup option filters (those with select fields).
    // TODO: move this logic into prototype-based code.
    for (i = 0; i < optionFilters.length; i++) {
        var optionFilter = optionFilters[i];
        // When the data for this option filter is ready, build the select field
        // with the options available in the data.
        jQuery("#" + optionFilter[0] + "-data").bind(
            "dataIsReady",
            buildOptionFilterCallback(optionFilter[0])
        );
    }
});

function buildOptionFilterCallback(optionFilterName) {
    // Builds an option filter's options given a set of data.
    return function (event, data) {
        var select = jQuery("#" + optionFilterName),
            option, i;
        for (i in data) {
            if (data.hasOwnProperty(i)) {
                option = jQuery("<option></option>");
                option.val(data[i]);
                option.text(data[i]);
                select.append(option);
            }
        }
    };
}

//
// Setup a custom Google map control for toggling the display of the filters.
//

function getFiltersControl() {
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
    FiltersControl.prototype.setButtonStyle_ = PNWMOTHS.Map.setButtonStyles;
    FiltersControl.prototype.getDefaultPosition = function() {
        return new GControlPosition(G_ANCHOR_BOTTOM_LEFT, new GSize(7, 7));
    };

    return new FiltersControl();
}

function getFilter(name, values) {
    return function (record) {
        if (typeof(values) !== "object" && record[name] == values) {
            return record;
        }
        else if (typeof(values) === "object" && values.length == 2 &&
                 record[name] >= values[0] && record[name] <= values[1]) {
            return record;
        }
        else {
            return null;
        }
    };
}

function filterData(data, filters) {
    var filtered_data = data,
        filter;
    for (filter in filters) {
        if (filters.hasOwnProperty(filter)) {
            filtered_data = jQuery.map(filtered_data,
                                       getFilter(filter, filters[filter]));
        }
    }
    return filtered_data;
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
