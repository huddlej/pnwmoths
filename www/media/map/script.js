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
            PNWMOTHS.Map.mgr = new MarkerManager(map);
            PNWMOTHS.Map.boundary = PNWMOTHS.Map.addBoundary(map);
            PNWMOTHS.Map.addControls(map);
            PNWMOTHS.Map.counties = PNWMOTHS.Map.getCounties();
            return map;
        },
        addBoundary: function(map) {
            var everythingElse = [
                new google.maps.LatLng(-87, 120),
                new google.maps.LatLng(-87, -87),
                new google.maps.LatLng(-87, 0)];
            var pnw = [
              new google.maps.LatLng(40, -126),
              new google.maps.LatLng(52.3, -130),
              new google.maps.LatLng(52.3, -105.0),
              new google.maps.LatLng(40, -105.0)];
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
            
            var fullscreenControl = PNWMOTHS.Map.control(controlDiv, "Click to go fullscreen", "Fullscreen");
            google.maps.event.addDomListener(fullscreenControl, 'click', function() {
                  var c = map.getCenter();
                  jQuery("#googlemap").toggleClass("fullscreen");
                  google.maps.event.trigger(map, 'resize');
                  map.setCenter(c);
            });
            
            var toggleBoundariesControl = PNWMOTHS.Map.control(controlDiv, "Click to toggle county lines", "Counties");
                jQuery(toggleBoundariesControl).toggle(function() { PNWMOTHS.Map.counties.setMap(map); }, function() { PNWMOTHS.Map.counties.setMap(null); });
            
            controlDiv.index = 1;
            controlDiv.style.marginLeft = '-5px';
            map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(controlDiv);
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
            var data = PNWMOTHS.Map.groupMarkerData(raw, map);

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
                            var marker = new google.maps.Marker({
                                position: point,
                                map: map,
                                icon: new google.maps.MarkerImage("http://fish.freeshell.org/style/small_red.png")
                            });
                            
                            markersArray.push(marker);
                            
                             /**
                             * add the listeners for the markerClicks and the sideBarClicks 
                             * 
                             * @type {google}
                             * @todo eventDomListener does not work yet, this is the click listener of the sidebar item's
                             */
							 
							 /**
							 * infoBubble Variable
							 * This variable is globally defined for defaults that are loaded.
							 */
							 infoBubbles = [];
                            google.maps.event.addListener(marker, 'click', PNWMOTHS.Map.handleMarkerClick(map, marker, i, data[i])); 
                        }
                    }

                    return markersArray;
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
                pointHtml = "<div class='infowindow'>",
                collectionHtml = "",
                notesHtml = "",
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

            // regex replace to display multiline notes properly in HTML
            notesHtml = "<p>" + record["notes"].replace(/\r\n/g, "<br />").replace(/\n/g, "<br />") + "</p>";

            return [pointHtml, collectionHtml, notesHtml];
        },
        openIB: null,
        openMarker: null,
        handleMarkerClick: function(map, marker, i, data) { 
            return function() { 
				if (infoBubbles[i] == undefined) {
					var html = PNWMOTHS.Map.renderMarkerRecord(data);
					infoBubbles[i] = new InfoBubble({ 
                                map: map,
                                disableAnimation: true,
                                minWidth: 340,
                                disableAutoPan: false, 
                                hideCloseButton: false, 
                                arrowPosition: 30, 
                                padding: 12
                     }); 
					 
                     infoBubbles[i].addTab('Site', html[0]);
                     infoBubbles[i].addTab('Collections', html[1]);
                     infoBubbles[i].addTab('Notes', html[2]);
				}
				var IB = infoBubbles[i];
                if (!IB.isOpen()) { 
                    if (PNWMOTHS.Map.openIB != null){
                        PNWMOTHS.Map.openIB.close(map, PNWMOTHS.Map.openMarker);
                    }
                    IB.open(map, marker);
                    PNWMOTHS.Map.openIB = IB;
                    PNWMOTHS.Map.openMarker = marker;
                }else{
                    IB.close(map, marker);
                    PNWMOTHS.Map.openIB = null;
                    PNWMOTHS.Map.openMarker = null;
                }
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
						if (ui.values.min < new Date(bounds.min).add(1) && ui.values.max > new Date(bounds.max).add(-1)) {
							delete PNWMOTHS.Filters.filters[name];
						}
						jQuery(document).trigger("requestData");
					});
                    
                    return jQuery("#f-" + name);
                },
                ajaxPopulate: false
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
                ajaxPopulate: false
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
                var add = function() {
                    PNWMOTHS.Map.markers = PNWMOTHS.Map.makeMarkers(data, PNWMOTHS.Map.map);
                    PNWMOTHS.Map.mgr.addMarkers(PNWMOTHS.Map.markers, 1);
                    PNWMOTHS.Map.mgr.refresh();
                };
                
                if (typeof PNWMOTHS.Map.map === "undefined") {
                    PNWMOTHS.Map.map = PNWMOTHS.Map.initialize();
                    // Always clear the current marker set before adding new markers.
                    google.maps.event.addListener(PNWMOTHS.Map.mgr, 'loaded', add);
                } else {
					if (PNWMOTHS.Map.openIB != null){
						PNWMOTHS.Map.openIB.close(PNWMOTHS.Map.map, PNWMOTHS.Map.openMarker);
						PNWMOTHS.Map.openIB = null;
					}
                    PNWMOTHS.Map.mgr.clearMarkers();
                    add();
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

		// Initialize each filter based on its type.
		jQuery.each(filters, function (index, filterConfig) {
			var filter = new filterConfig.type(filterConfig);
			filter.initialize();
			// Option filters rely on externally loaded data for their options.
			if (filter.ajaxPopulate) {
				// When the data for this option filter is ready, build the select
				// field with the options available in the data.
				jQuery("#" + filterConfig.name + "-data").bind("dataIsReady", filter.populate);
			}
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
		});
    }
});
