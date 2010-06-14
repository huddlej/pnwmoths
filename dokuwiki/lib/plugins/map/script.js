/*
 * The PNWMOTHS namespace includes the following sections:
 *
 * - Map: methods for displaying a Google Map of species data
 * - Filters: methods and classes for filtering data used by Map methods
 */

var PNWMOTHS = PNWMOTHS || {};
PNWMOTHS.Map = function () {
    return {
        xml: [],
        states: [
            "washington",
            "oregon",
            "idaho",
            "utah",
            "montana",
            "california",
            "nevada"
        ],
        initialize: function () {
            var mapDiv, map;
            if (typeof(GBrowserIsCompatible) == "undefined" || !GBrowserIsCompatible()) {
                jQuery("#googlemap").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
                return;
            }

            // TODO: remove dependence on hardcoded map id.
            mapDiv = jQuery("#googlemap");
            mapDiv.show();
            map = new GMap2(mapDiv.get(0));

            // Center on Washington State.
            PNWMOTHS.Map.mapCenter = new GLatLng(46.90, -118.00);
            map.setCenter(PNWMOTHS.Map.mapCenter, 5);
            map.addControl(new GSmallMapControl());
            map.addControl(new GMapTypeControl());
            map.addControl(PNWMOTHS.Map.getFullscreenControl());
            map.addMapType(G_PHYSICAL_MAP);
            map.removeMapType(G_NORMAL_MAP);
            map.removeMapType(G_SATELLITE_MAP);
            map.setMapType(G_PHYSICAL_MAP);

            PNWMOTHS.Map.bounds = PNWMOTHS.Map.addTerritoryBoundaries(map);
            PNWMOTHS.Map.icons = PNWMOTHS.Map.buildMapIcons();
            PNWMOTHS.Map.mgr = new MarkerManager(map);

            // Add filters to map container.
            if (typeof(PNWMOTHS.Filters.getFilterElement()) !== "undefined") {
                map.addControl(PNWMOTHS.Filters.getFiltersControl());
                map.getContainer().appendChild(PNWMOTHS.Filters.getFilterElement().get(0));
            }

            return map;
        },
        toggleBorders: function () {
            var geo_xml;

            // If the XML attribute is empty but the states attribute isn't, the
            // XML needs to be loaded.
            if (PNWMOTHS.Map.xml.length != PNWMOTHS.Map.states.length) {
                jQuery.each(PNWMOTHS.Map.states, function (index, state) {
                    // Adding the new GGeoXml overlay to the map will load the
                    // overlay data for the first time.
                    geo_xml = new GGeoXml("http://www.biol.wwu.edu/~huddlej/pnwmoths/" + state + ".kmz");
                    PNWMOTHS.Map.xml.push(geo_xml);
                    PNWMOTHS.Map.map.addOverlay(geo_xml);
                });
            }
            else {
                // After border data has been loaded, it only needs to be
                // toggled on or off.
                jQuery.each(PNWMOTHS.Map.xml, function (index, xml) {
                    if (xml.isHidden()) {
                        xml.show();
                    }
                    else {
                        xml.hide();
                    }
                });
            }

            return this.xml;
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

                    collection = PNWMOTHS.Map.renderCollection(data[i]);
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
                return new GControlPosition(G_ANCHOR_BOTTOM_LEFT, new GSize(7, 7));
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
                collectionHtml += "<th><a href='/dokuwiki/factsheets/collection_glossary' target='_new'>Collection</a></th>";
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

            return markers;
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
            return button
        },
        renderCollection: function (record) {
            // Render all collection related information for a given record.
            // Set the date for this marker.
            var date = PNWMOTHS.Map.renderDate(record);

            // Only render collections that have a date and aren't protected.
            if (date != "" && !record.is_protected) {
                return [date, record.collector, record.collection];
            }

            return null;
        },
        renderDate: function (record) {
            // Render a date string for a given record.
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
    };
}();
PNWMOTHS.Filters = function () {
    var filter_element;

    return {
        "filters": {},
        "getFilterElement": function () {
            return filter_element;
        },
        "capitalize": function (word) {
            // Capitalize the first letter of the given word. Stolen from John
            // Resig's more complete titleCaps function:
            // http://ejohn.org/files/titleCaps.js
            return word.substr(0,1).toUpperCase() + word.substr(1);
        },
        "initialize": function (element) {
            filter_element = jQuery(element);
            return filter_element
        },
        "getFilterFunction": function (name, values) {
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
        },
        "filterData": function (data, filters) {
            var filtered_data = data,
                filter;
            for (filter in filters) {
                if (filters.hasOwnProperty(filter)) {
                    filtered_data = jQuery.map(
                        filtered_data,
                        PNWMOTHS.Filters.getFilterFunction(filter, filters[filter])
                    );
                }
            }
            return filtered_data;
        },
        "TextFilter": function (filterConfig) {
            // Handles processing of text filters. Expects the following ids in
            // the DOM:
            //
            //  * #form-{name} - the form that wraps the filter's select field.
            //  * #clear-filter-{name} - the element that is used to clear the filter.
            //  * #start{name} - the element that has the start value of the filter range.
            //  * #end{name} - the element that has the end value of the filter range.
            var name = filterConfig.name,
                valueCallback = filterConfig.callback,
                helpText = "";

            if (filterConfig.hasOwnProperty("help_text")) {
                helpText = filterConfig.help_text;
            }

            return {
                initialize: function () {
                    // TODO: add attribute for form instance and clear filter button instance.
                    jQuery("#form-" + name).submit(this.submit);
                    jQuery("#clear-filter-" + name).click(this.clear);
                    jQuery("#form-" + name).bind("clear", this.clear);
                    return jQuery("#form-" + name);
                },
                submit: function (event) {
                    event.preventDefault();
                    // TODO: add attributes for start and end jQuery instances
                    var start = jQuery("#start" + name).val(),
                        end = jQuery("#end" + name).val();

                    if (typeof(valueCallback) == "function") {
                        PNWMOTHS.Filters.filters[name] = [valueCallback(start),
                                                          valueCallback(end)];
                    }
                    else {
                        PNWMOTHS.Filters.filters[name] = [start, end];
                    }

                    jQuery(document).trigger("requestData");
                },
                clear: function (event) {
                    jQuery("#form-" + name).children("input:text").val("");
                    event.preventDefault();
                    if (PNWMOTHS.Filters.filters.hasOwnProperty(name)) {
                        delete PNWMOTHS.Filters.filters[name];
                        jQuery(document).trigger("requestData");
                    }
                },
                render: function () {
                    var p, form, start_input, end_input, parent;
                    parent = filter_element;
                    p = jQuery("<p id=\"filter-" + name + "\">" + PNWMOTHS.Filters.capitalize(name) + ":</p>");
                    form = jQuery("<form id=\"form-" + name + "\"></form>");
                    start_input = jQuery("<input type=\"text\" id=\"start" + name + "\" size=\"8\" title=\"start " + name + "\" />");
                    end_input = jQuery("<input type=\"text\" id=\"end" + name + "\" size=\"8\" title=\"end " + name + "\" />");
                    form.append(start_input);
                    form.append(end_input);
                    form.append(jQuery("<input type=\"submit\" value=\"Filter\" />"));
                    form.append(jQuery("<input type=\"button\" id=\"clear-filter-" + name + "\" value=\"Clear\" />"));
                    if (helpText != "") {
                        form.append(jQuery("<br />"));
                        form.append(jQuery("<span class=\"help\">" + helpText + "</span>"));
                    }
                    parent.append(p);
                    parent.append(form);
                    return parent;
                }
            };
        },
        "OptionFilter": function (filterConfig) {
            // Handles processing of option filters. Expects the following ids
            // in the DOM:
            //
            //  * #form-{name} - the form that wraps the filter's select field.
            //  * #clear-filter-{name} - the element that is used to clear the filter.
            //  * #{name} - the element that has the value of the filter.
            var name = filterConfig.name,
                valueCallback = filterConfig.callback,
                helpText = "";

            if (filterConfig.hasOwnProperty("help_text")) {
                helpText = filterConfig.help_text;
            }

            return {
                initialize: function () {
                    jQuery("#form-" + name).submit(this.submit);
                    jQuery("#clear-filter-" + name).click(this.clear);
                    jQuery("#form-" + name).bind("clear", this.clear);
                    return jQuery("#form-" + name);
                },
                submit: function (event) {
                    event.preventDefault();
                    var start = jQuery("#" + name).val();

                    if (typeof(valueCallback) == "function") {
                        PNWMOTHS.Filters.filters[name] = valueCallback(start);
                    }
                    else {
                        PNWMOTHS.Filters.filters[name] = start;
                    }

                    jQuery(document).trigger("requestData");
                },
                clear: function (event) {
                    event.preventDefault();
                    jQuery("#form-" + name).children("select").val("");
                    if (PNWMOTHS.Filters.filters.hasOwnProperty(name)) {
                        delete PNWMOTHS.Filters.filters[name];
                        jQuery(document).trigger("requestData");
                    }
                },
                populate: function (event, data) {
                    // Builds an option filter's options given a set of data.
                    var select = jQuery("#" + name),
                        option, i;
                    for (i in data) {
                        if (data.hasOwnProperty(i)) {
                            option = jQuery("<option></option>");
                            option.val(data[i]);
                            option.text(data[i]);
                            select.append(option);
                        }
                    }

                    return select;
                },
                render: function () {
                    var p, form, select_input, parent;
                    parent = filter_element;
                    p = jQuery("<p id=\"filter-" + name + "\">" + PNWMOTHS.Filters.capitalize(name) + ":</p>");
                    form = jQuery("<form id=\"form-" + name + "\"></form>");
                    select_input = jQuery("<select id=\"" + name + "\" name=\"" + name + "\"></select>");
                    select_input.append(jQuery("<option>Select a " + name + "</option>"));
                    form.append(select_input);
                    form.append(jQuery("<input type=\"submit\" value=\"Filter\" />"));
                    form.append(jQuery("<input type=\"button\" id=\"clear-filter-" + name + "\" value=\"Clear\" />"));
                    if (helpText != "") {
                        form.append(jQuery("<br />"));
                        form.append(jQuery("<span class=\"help\">" + helpText + "</span>"));
                    }
                    parent.append(p);
                    parent.append(form);
                    return parent;
                }
            };
        },
        "getFiltersControl": function () {
            // Setup a custom Google map control for toggling the display of the
            // filters.
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
                        filter_element.toggle();
                    }
                );

                map.getContainer().appendChild(container);
                return container;
            };
            // Sets the proper CSS for the given button element.
            FiltersControl.prototype.setButtonStyle_ = PNWMOTHS.Map.setButtonStyles;
            FiltersControl.prototype.getDefaultPosition = function() {
                return new GControlPosition(G_ANCHOR_BOTTOM_LEFT, new GSize(80, 7));
            };

            return new FiltersControl();
        }
    };
}();

jQuery(document).unload(function () {
    if (typeof(GUnload) != "undefined") {
        GUnload();
    }
});

jQuery(document).ready(function () {
    // TODO: replace hardcoded "googlemap" id with custom id based on plugin arguments.
    var data_id, data_name;

    if (jQuery("#googlemap .data").length == 0) {
        return;
    }

    data_name = jQuery.parseJSON(jQuery("#googlemap .data").text());
    if (typeof(data_name) != "string") {
        // Take the first argument from a list or object.
        data_name = data_name[0];
    }
    data_id = "#" + data_name;

    //
    // Setup filters.
    //

    // Initialize filters.
    PNWMOTHS.Filters.initialize("#filters");

    // Close filter window.
    jQuery("#filters-close").click(
        function (event) {
            event.preventDefault();
            PNWMOTHS.Filters.getFilterElement().hide();
        }
    );

    // Clear all filters.
    jQuery("#clear-filters").click(
        function (event) {
            event.preventDefault();
            PNWMOTHS.Filters.filters = {};
            jQuery("#filters form").trigger("clear");
            jQuery(document).trigger("requestData");
        }
    );

    function getSortableDate(date) {
        var date_pieces = date.split("/");
        return [date_pieces.pop()].concat(date_pieces).join("/");
    }

    // Define filters.
    filters = [
        {"name": "elevation", "type": PNWMOTHS.Filters.TextFilter, "help_text": "(e.g., 2000 - 10000)"},
        {"name": "date", "type": PNWMOTHS.Filters.TextFilter, "callback": getSortableDate, "help_text": "(e.g., 1/1/1999 - 12/1/2000)"},
        {"name": "county", "type": PNWMOTHS.Filters.OptionFilter},
        {"name": "state", "type": PNWMOTHS.Filters.OptionFilter}
    ];

    // Initialize each filter based on its type.
    jQuery.each(filters, function (index, filterConfig) {
        var filter = new filterConfig.type(filterConfig);
        filter.render();
        filter.initialize();

        // Option filters rely on externally loaded data for their options.
        if (filterConfig.type == PNWMOTHS.Filters.OptionFilter) {
            // When the data for this option filter is ready, build the select
            // field with the options available in the data.
            jQuery("#" + filterConfig.name + "-data").bind("dataIsReady", filter.populate);
        }
    });

    PNWMOTHS.Map.map = PNWMOTHS.Map.initialize();

    // Toggle map borders.
    jQuery("#toggle-borders").click(
        function (event) {
            event.preventDefault();
            PNWMOTHS.Map.toggleBorders();
        }
    );

    // TODO: maybe this should go into the fullscreen control.
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
        if (PNWMOTHS.Filters.getFilterElement().css("display") != "none") {
            PNWMOTHS.Filters.getFilterElement().fadeTo(10, 0.3).fadeTo(5000, 1);
        }

        // Filter data locally and let all listeners know the data is ready.
        jQuery(data_id).trigger(
            "dataIsReady",
            [PNWMOTHS.Filters.filterData(
                PNWMOTHS.Data.data[data_name],
                PNWMOTHS.Filters.filters
            )]
        );
    });

    jQuery(data_id).bind(
        "dataIsReady",
        function (event, data) {
            var markers;

            // Always clear the current marker set before adding new markers.
            PNWMOTHS.Map.mgr.clearMarkers();

            // Use the marker manager to add multiple markers simulataneously
            // and set the maximum and minimum zoom levels at which the markers
            // should be displayed.
            markers = PNWMOTHS.Map.createMarkers(data);

            PNWMOTHS.Map.mgr.addMarkers(
                markers,
                PNWMOTHS.Map.map.getCurrentMapType().getMinimumResolution(),
                PNWMOTHS.Map.map.getCurrentMapType().getMaximumResolution()
            );
            PNWMOTHS.Map.mgr.refresh();
        }
    );
});