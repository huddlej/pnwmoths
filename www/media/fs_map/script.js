/*
 * The PNWMOTHS namespace includes the following sections:
 *
 * - Map: methods for displaying a Google Map of species data
 * - Filters: methods and classes for filtering data used by Map methods
 */

var PNWMOTHS = PNWMOTHS || {};
PNWMOTHS.Map = function () {
    return {
        initialize: function () {
            // TODO: Compatability check
            
            var mapDiv, map;
            mapDiv = jQuery("#googlemap");
            mapDiv.show();
            PNWMOTHS.Map.centerPoint = new google.maps.LatLng(46.9, -118.0);
            var options = {
                zoom: 4,
                streetViewControl: false,
                center: PNWMOTHS.Map.centerPoint,
                mapTypeId: 'terrain'
            };  
            map = new google.maps.Map(mapDiv[0], options);
            PNWMOTHS.Map.boundary = PNWMOTHS.Map.addBoundary(map);
            PNWMOTHS.Map.addControls(map);
            PNWMOTHS.Map.counties = PNWMOTHS.Map.getCounties();
            PNWMOTHS.Map.openIB = new InfoBubble({ 
                map: map,
                disableAnimation: true,
                minWidth: 300,
                disableAutoPan: false, 
                hideCloseButton: false, 
                arrowPosition: 30, 
                padding: 12
             }); 
             
             // Height hack which fixes horribly slow load on ipad (unknown js issue inside of infobubble.js - getElementSize_
             PNWMOTHS.Map.openIB.addTab('Site', "<br /><br /><br /><br /><br /><br /><br />"); 
             PNWMOTHS.Map.openIB.addTab('Collections', ""); 
             PNWMOTHS.Map.openIB.addTab('Notes', "");
             PNWMOTHS.Map.openIB.calcOnce = false;             

            return map;
        },
        addBoundary: function(map) {
            var everythingElse = [
                new google.maps.LatLng(-87, 120),
                new google.maps.LatLng(-87, -87),
                new google.maps.LatLng(-87, 0)];
            var pnw = [
              new google.maps.LatLng(39, -126),
              new google.maps.LatLng(52.3, -130),
              new google.maps.LatLng(52.3, -109.0),
              new google.maps.LatLng(39, -109.0)];
            var polygon = new google.maps.Polygon({
              paths: [everythingElse, pnw],
              strokeColor: "#003F87",
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: "#000000",
              fillOpacity: .1
            });
            polygon.setMap(map);
            return polygon;
        },
        control: function(controlDiv, title, text) {
            controlDiv.style.marginRight = '5px';
            controlDiv.style.marginBottom = '5px';
            // Set CSS for the control border
            var controlUI = document.createElement('DIV');
            controlUI.style.float = 'left';
            controlUI.style.padding = '2px';
            controlUI.style.backgroundColor = 'white';
            controlUI.style.borderStyle = 'solid';
            controlUI.style.borderWidth = '1px';
            controlUI.style.cursor = 'pointer';
            controlUI.style.textAlign = 'center';
            controlUI.title = title;
            controlDiv.appendChild(controlUI);

            // Set CSS for the control interior
            var controlText = document.createElement('DIV'); 
            controlText.style.fontFamily = 'Arial,sans-serif';
            controlText.style.fontSize = '12px';
            controlText.style.paddingLeft = '4px';
            controlText.style.paddingRight = '4px';
            controlText.innerHTML = '<b>' + text + '</b>';
            controlUI.appendChild(controlText);
            
            return controlUI;
        },
        addControls: function(map) {
            var controlDiv = document.createElement('DIV');
            controlDiv.index = 1;
            controlDiv.style.marginLeft = '-5px';
            jQuery(controlDiv).addClass('gmnoprint');
            
            var fullscreenControl = PNWMOTHS.Map.control(controlDiv, "Click to go fullscreen", "Fullscreen");
            google.maps.event.addDomListener(fullscreenControl, 'click', function() {
                  var c = map.getCenter();
                  var b = map.getBounds();
                  window.scrollTo(0,0);
                  jQuery("html").toggleClass("fullscreen");
                  jQuery("#googlemap").toggleClass("fullscreen");
                  google.maps.event.trigger(map, 'resize');
                    var fullscreen = jQuery("#googlemap").hasClass("fullscreen");
                  if(fullscreen)
                      this.children[0].innerHTML = '<b>Exit Fullscreen</b>';
                  else
                      this.children[0].innerHTML = '<b>Fullscreen</b>';
                  map.setCenter(c);
            });
            
            var toggleBoundariesControl = PNWMOTHS.Map.control(controlDiv, "Click to toggle county lines", "Counties");
                jQuery(toggleBoundariesControl).toggle(function() { PNWMOTHS.Map.counties.setMap(map); }, function() { PNWMOTHS.Map.counties.setMap(null); });
            
            map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(controlDiv);

            var controlDiv = document.createElement('DIV');
            controlDiv.style.marginLeft = '5px';
            controlDiv.index = 1;
            jQuery(controlDiv).addClass('gmnoprint');
            
            var homeControl = PNWMOTHS.Map.control(controlDiv, "Reset the Viewport", "Reset View");
            google.maps.event.addDomListener(homeControl, 'click', function() {
                  map.setZoom(4);
                  map.setCenter(PNWMOTHS.Map.centerPoint);
                  google.maps.event.trigger(map, 'resize');
            });
            map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(controlDiv);
        },
        getCounties: function() {      
            return new google.maps.FusionTablesLayer({
              query: {
                select: 'geometry',
                from: '3165511'
              },
                options : {suppressInfoWindows:true}, 
              styles: [{
              markerOptions: {
                iconName: "transparent"
              },
              polygonOptions: {
                fillColor: "#FFFFFF",
                fillOpacity: 0.01,
                strokeColor: "#FFFFFF",
                strokeOpacity: 0.5,
                strokeWeight: "2"
              },
              polylineOptions: {
                strokeColor: "#rrggbb",
                strokeWeight: "int"  }
              }]
            });
        },
        htmlData: null,
        openMarker: function(i){
            PNWMOTHS.Map.handleMarkerClick(PNWMOTHS.Map.htmlData[i])();
        },
        /**
         * setPoints(locations)
         * 
         * sets the marker, infoBubble and sidebarItem based on the locations 
         * that were returned from the JSON query.
         * MODIFIED BY PHILIP BJORGE: Removed sidebars, some comments
         * 
         * @param {array} locations array of all of the points, and their settings/html
         * 
         * @author Mike DeVita
         * @author Google Maps API
         * @copyright 2011 MapIT USA
         * @category map_js
         */     
        makeMarkers: function(raw, map){      
            /**
             * array of all of the markers that are on the map
             */
            var markersArray = [];

            // Caches our rendered html on first run
            if(PNWMOTHS.Map.htmlData == null)
                PNWMOTHS.Map.htmlData = PNWMOTHS.Map.groupMarkerData(raw, map);
            var data = raw;
                    // Build a list of markers for the given data. Data is indexed by a
                    // latitude/longitude tuple so i[0] is latitude and i[1] is
                    // longitude.
                    for (i in data) {
                        if (data.hasOwnProperty(i)) {
                            point = new google.maps.LatLng(data[i].latitude, data[i].longitude);
                            /**
                             * marker variable, stores all of the information pertaining to a specific marker
                             * this variable creates the marker, places it on the map and then also sets some
                             * custom options for the infoBubbles.
                             * 
                             * @type {google}
                             */
                            var marker = new com.redfin.FastMarker(/*id*/i, point, ["<div class='marker' onclick='PNWMOTHS.Map.openMarker(\""+data[i].latitude+","+data[i].longitude+"\")'>&nbsp;</div>"], null);
                            markersArray.push(marker);
                        }
                    }
                    return (new com.redfin.FastMarkerOverlay(map, markersArray));
        },
        renderMarkerRecord: function(record) {
            // Render one marker data record to an array of HTML for the marker
            // info window tabs.
            var attributes = {"site_name": "Locality",
                              "county": "County",
                              "state": "State",
                              "elevation": "Elevation (ft.)",
                              "latitude": "Latitude",
                              "longitude": "Longitude"},
                attHtml = new Array(), colHtml = new Array(), notesHtml,
                attribute, attribute_name, attribute_value, i, j;
            attHtml.push('<div id="IB_att" class="infowindow">');
            for (attribute in attributes) {
                if (attributes.hasOwnProperty(attribute)) {
                    attribute_name = attributes[attribute];
                    if (record[attribute]) {
                        attribute_value = record[attribute];
                    }
                    else {
                        attribute_value = "";
                    }
                    attHtml.push("<p>" + attribute_name + ": " + attribute_value + "</p>");
                }
            }

            attHtml.push("</div>");

            if (record.hasOwnProperty("collections") && record.collections.length > 0) {
                colHtml.push('<div id="IB_col"  class="infowindow collections">');
                colHtml.push("<table>");
                colHtml.push("<tr><th>Date</th><th>Collector</th>");
                colHtml.push("<th><a href='/dokuwiki/factsheets/collection_glossary' target='_new'>Collection</a></th>");
                for (i in record.collections) {
                    if (record.collections.hasOwnProperty(i)) {
                        colHtml.push("<tr>");
                        for (j in record.collections[i]) {
                            if (record.collections[i].hasOwnProperty(j)) {
                                var col_val = record.collections[i][j];
                                if (!col_val)
                                    col_val = "";
                                colHtml.push("<td>" + col_val + "</td>");
                            }
                        }
                        colHtml.push("</tr>");
                    }
                }
                colHtml.push("</table>");
                colHtml.push("</div>");
            }

            // regex replace to display multiline notes properly in HTML
            notesHtml = '<div id="IB_notes" class="infowindow collections"><p>' + record["notes"].replace(/\r\n/g, "<br />").replace(/\n/g, "<br />") + "</p></div>";

            return [attHtml.join(''), colHtml.join(''), notesHtml];
        },
        openIB: null,
        handleMarkerClick: function(data) { 
            return function() { 
                var html = PNWMOTHS.Map.renderMarkerRecord(data);

                var IB = PNWMOTHS.Map.openIB;
                var update = function() {
                    IB.removeTab(0); IB.removeTab(0); IB.removeTab(0);
                    IB.addTab('Site', html[0]);
                    IB.addTab('Collections', html[1]);
                    IB.addTab('Notes', html[2]);
                };
                if (IB.isOpen()) 
                    IB.close();
                update();

                // FastMarkers uses overlays and InfoBubbles use markers
                // Creates a marker on the fly to "hack" the position
                var point = new google.maps.LatLng(data.latitude, data.longitude);
                IB.open(PNWMOTHS.Map.map, new google.maps.Marker({position: point, clickable: false, flat: true, visible: false}));
                IB.calcOnce = false;
            } 
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
                    "precision",
                    "notes"
                ];

            for (i in data) {
                if (data.hasOwnProperty(i) && data[i].latitude != null && data[i].longitude != null) {
                    // Remove null lat,lon pairs from the map
                    // These will still show up in phenology
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
                renderCollection: function (record) {
            // Render all collection related information for a given record.
            // Set the date for this marker.
            var date = PNWMOTHS.Map.renderDate(record);

            // Only render collections that aren't protected.
            if (!record.is_protected) {
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
                return "None";
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
        "initialize": function (element) {
            filter_element = jQuery(element);
            return filter_element;
        },
        "getFilterFunction": function (name, values) {
            return function (record) {
                if (name == "elevation" || name == "date") {
                    if (name == "date")
                            var t = new Date(record[name]);
                    else
                            var t = record[name];
                    
                    if (record[name] != null && t >= values[0] && t <= values[1]) {
                            return record;
                    }
                } else {
                    for (var j = 0; j < values.length; j++) {
                        if (values[j] == "None (CANADA)")
                            values[j] = null;
                        if (record[name] == values[j])
                                return record;
                    }
                }
                return null;
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
        "MultiSelectFilter": function(filterConfig) {
               // Handles processing of option filters. Expects the following ids
                // in the DOM:
                //
                //  * #form-{name} - the form that wraps the filter's select field.
                //  * #clear-filter-{name} - the element that is used to clear the filter.
                //  * #{name} - the element that has the value of the filter.
                var name = filterConfig.name;
                var noneSelectedText = filterConfig.noneSelectedText;
                var selectedText = filterConfig.selectedText;
                var ajaxPopulate = filterConfig.ajax;
                var finishInit = function() {
                    jQuery("#f-" + name).multiselect({
                            noneSelectedText: noneSelectedText,
                            selectedText: selectedText,
                            selectedList: 10,
                            minWidth: "auto"
                    }).multiselectfilter();
                        
                    var updateFilter = function(event, ui) {
                        PNWMOTHS.Filters.filters[name] = jQuery(this).multiselect("getChecked").map(function() { return this.value; });
                        if (PNWMOTHS.Filters.filters[name].length == 0)
                                delete PNWMOTHS.Filters.filters[name];
                        jQuery(document).trigger("requestData");
                    };
				
                    jQuery("#f-" + name).bind("multiselectclick", updateFilter);
                    jQuery("#f-" + name).bind("multiselectcheckall", updateFilter);
                    jQuery("#f-" + name).bind("multiselectuncheckall", updateFilter);
                };

                return {
                initialize: function () {
                    if(!ajaxPopulate) {
                        finishInit();
                    }
                    return jQuery("#f-" + name);
                },
                ajaxPopulate: ajaxPopulate,
                populate: function (event, data) {
					jQuery(this).unbind(event);
                    // Builds an option filter's options given a set of data.
                    var select = jQuery("#f-" + name),
                        option, i;
                    for (i in data) {
                        if (data.hasOwnProperty(i)) {
                            option = jQuery("<option></option>");
                            option.val(data[i]);
                            option.text(data[i]);
                            select.append(option);
                        }
                    }
                    
                    finishInit();
                    
                    return select;
                },
                reset: function() {
                    jQuery("#f-" + name).multiselect("uncheckAll");
               }
            };            
        },
        "DateRangeFilter": function(filterConfig) {
           // Handles processing of option filters. Expects the following ids
            // in the DOM:
            //
            //  * #form-{name} - the form that wraps the filter's select field.
            //  * #clear-filter-{name} - the element that is used to clear the filter.
            //  * #{name} - the element that has the value of the filter.
            var name = filterConfig.name;
            var bounds = filterConfig.bounds;

            return {
                initialize: function () {
                    jQuery("#f-" + name).dateRangeSlider({defaultValues:bounds,
                                                          bounds: bounds, arrows: false});   
                    // Change handler
                    jQuery("#f-" + name).bind("valuesChanged", function(event, ui) {
						PNWMOTHS.Filters.filters[name] = [ui.values.min, ui.values.max];
                                                if (ui.values.min < new Date(bounds.min + (1 * 1000 * 60 * 60 * 24)) &&
                                                    ui.values.max > new Date(bounds.max - (1 * 1000 * 60 * 60 * 24))) {
							delete PNWMOTHS.Filters.filters[name];
						}
						jQuery(document).trigger("requestData");
					});
                    
                    return jQuery("#f-" + name);
                },
                ajaxPopulate: false,
                reset: function() {
                    var m = jQuery("#f-" + name);
                    var b = m.dateRangeSlider("bounds");
                    m.dateRangeSlider("values", b.min, b.max); 
                    delete PNWMOTHS.Filters.filters[name];
                }
            };            
        },
        "EditRangeFilter": function(filterConfig) {
           // Handles processing of option filters. Expects the following ids
            // in the DOM:
            //
            //  * #form-{name} - the form that wraps the filter's select field.
            //  * #clear-filter-{name} - the element that is used to clear the filter.
            //  * #{name} - the element that has the value of the filter.
            var name = filterConfig.name;
            var bounds = filterConfig.bounds ;

            return {
                initialize: function () {
                    jQuery("#f-" + name).editRangeSlider({defaultValues: bounds,
                                                          bounds: bounds,arrows: false}); 
                    // Change handler
                    jQuery("#f-" + name).bind("valuesChanged", function(event, ui) {
						PNWMOTHS.Filters.filters[name] = [ui.values.min, ui.values.max];
						if (ui.values.min < bounds.min+1 && ui.values.max > bounds.max-1) {
							delete PNWMOTHS.Filters.filters[name];
						}
						jQuery(document).trigger("requestData");
					});
                    
                    return jQuery("#f-" + name);
                },
                ajaxPopulate: false,
                reset: function() {
                    var m = jQuery("#f-" + name);
                    var b = m.editRangeSlider("bounds");
                    m.editRangeSlider("values", b.min, b.max); 
                    delete PNWMOTHS.Filters.filters[name];
                }
            };            
        }
        

    };
}();

jQuery(document).unload(function () {
    if (typeof(GUnload) != "undefined") {
        GUnload();
    }
});

jQuery(document).ready(function () {
    if (jQuery("#googlemap .data").length != 0) {
		// 
		// MAP INIT
		//
        var data_name = jQuery.parseJSON(jQuery("#googlemap .data").text());
        if (typeof(data_name) != "string") {
            // Take the first argument from a list or object.
            data_name = data_name[0];
        }
        var data_id = "#" + data_name;
    
        jQuery(data_id).bind(
            "dataIsReady",
            function (event, data) {
                if (typeof PNWMOTHS.Map.map === "undefined") {
                    PNWMOTHS.Map.map = PNWMOTHS.Map.initialize();
                    google.maps.event.addListenerOnce(PNWMOTHS.Map.map, 'idle', function() {
                          google.maps.event.trigger(PNWMOTHS.Map.map, 'resize');
                            PNWMOTHS.Map.markers = PNWMOTHS.Map.makeMarkers(data, PNWMOTHS.Map.map);
                    });
                } else {
                    PNWMOTHS.Map.openIB.close();
                    PNWMOTHS.Map.markers.setMap(null);
                    delete PNWMOTHS.Map.markers;
                    PNWMOTHS.Map.markers = PNWMOTHS.Map.makeMarkers(data, PNWMOTHS.Map.map);
                }
            });
			
		    // Initialize filters.
		PNWMOTHS.Filters.initialize("#filters");

		// Define filters.
		filters = [
			{"name": "county", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Counties", "selectedText": "Filtering on # counties", "ajax": true},
			{"name": "state", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "States", "selectedText": "Filtering on # states", "ajax": true},
			{"name": "collection", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Collections", "selectedText": "Filtering on # collections", "ajax": true},
			{"name": "date", "type": PNWMOTHS.Filters.DateRangeFilter, "bounds": {min:new Date(1900,0,1), max:new Date()}},
			{"name": "year", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Years", "selectedText": "Filtering on # years", "ajax": false},
			{"name": "month", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Months", "selectedText": "Filtering on # months", "ajax": false},
			{"name": "day", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Days", "selectedText": "Filtering on # days", "ajax": false},
			{"name": "elevation", "type": PNWMOTHS.Filters.EditRangeFilter, "bounds": {min: 0, max: 10000}}
		];

                var init_filters = [];
		// Initialize each filter based on its type.
		jQuery.each(filters, function (index, filterConfig) {
			var filter = new filterConfig.type(filterConfig);
                        init_filters.push(filter);
			filter.initialize();
			// Option filters rely on externally loaded data for their options.
			if (filter.ajaxPopulate) {
				// When the data for this option filter is ready, build the select
				// field with the options available in the data.
				jQuery("#" + filterConfig.name + "-data").bind("dataIsReady", filter.populate);
			}
		});

                jQuery("#f-reset").click(function() {
                    jQuery.each(init_filters, function(index, f) {
                        f.reset();
                    });
                    jQuery(document).trigger("requestData");
                });

                // TODO: rename event to filterData?
                // Setup custom events "requestData" and "dataIsReady". The latter initiates
                // a request to the data service passing any filters that have been
                // set. When the data is ready, the "dataIsReady" event is triggered.
                jQuery(document).bind("requestData", function (event) {
                        // Filter data locally and let all listeners know the data is ready.
                        jQuery(data_id).trigger(
                                "dataIsReady",
                                [PNWMOTHS.Filters.filterData(
                                        PNWMOTHS.Data.data[data_name],
                                        PNWMOTHS.Filters.filters
                                )]
                        );
                });
    }
});
