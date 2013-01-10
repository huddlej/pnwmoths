/*
 * The PNWMOTHS namespace includes the following sections:
 *
 * - Map: methods for displaying a Google Map of species data
 * - Filters: methods and classes for filtering data used by Map methods
 */


// autolink
// urlize - https://github.com/ljosa/urlize.js
var urlize=function(){function t(e,t){return e.substr(0,t.length)==t}function n(e,t){return e.substr(e.length-t.length,t.length)==t}function r(e,t){var n=0,r=0;for(;;){r=e.indexOf(t,r);if(r==-1)break;n++,r+=t.length}return n}function s(e){return e.indexOf("%")==-1||e.match(i)?encodeURI(e):e}function v(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function m(e){var t;return e.length==2&&typeof e[1]=="object"?t=e[1]:t={nofollow:e[1],autoescape:e[2],trim_url_limit:e[3],target:e[4]},"django_compatible"in t||(t.django_compatible=!0),t}function g(i,g){function y(e,t){return t===undefined&&(t=g.trim_url_limit),t&&e.length>t?e.substr(0,t-3)+"...":e}g=m(arguments);var b=!1,w=g.django_compatible?l:c,E=g.django_compatible?o:u,S=g.django_compatible?a:f,x=e(i,w);for(var T=0;T<x.length;T++){var N=x[T],C=undefined;if(N.indexOf(".")!=-1||N.indexOf("@")!=-1||N.indexOf(":")!=-1){var k="",L=N,A="";for(var O=0;O<E.length;O++){var M=E[O];n(L,M)&&(L=L.substr(0,L.length-M.length),A=M+A)}for(var O=0;O<S.length;O++){var _=S[O][0],D=S[O][1];t(L,_)&&(L=L.substr(_.length),k+=_),n(L,D)&&r(L,D)==r(L,_)+1&&(L=L.substr(0,L.length-D.length),A=D+A)}var P=undefined,H=g.nofollow?' rel="nofollow"':"",B=g.target?' target="'+g.target+'"':"";L.match(h)?P=s(L):L.match(p)?P=s("http://"+L):L.indexOf(":")==-1&&L.match(d)&&(P="mailto:"+L,H="");if(P){var j=y(L);g.autoescape&&(k=v(k),A=v(A),P=v(P),j=v(j)),L='<a href="'+P+'"'+H+B+">"+j+"</a>",x[T]=k+L+A}else b||g.autoescape&&(x[T]=v(N))}else b||g.autoescape&&(x[T]=v(N))}return x.join("")}var e;e=e||function(e){var t=String.prototype.split,n=/()??/.exec("")[1]===e,r;return r=function(r,i,s){if(Object.prototype.toString.call(i)!=="[object RegExp]")return t.call(r,i,s);var o=[],u=(i.ignoreCase?"i":"")+(i.multiline?"m":"")+(i.extended?"x":"")+(i.sticky?"y":""),a=0,i=new RegExp(i.source,u+"g"),f,l,c,h;r+="",n||(f=new RegExp("^"+i.source+"$(?!\\s)",u)),s=s===e?-1>>>0:s>>>0;while(l=i.exec(r)){c=l.index+l[0].length;if(c>a){o.push(r.slice(a,l.index)),!n&&l.length>1&&l[0].replace(f,function(){for(var t=1;t<arguments.length-2;t++)arguments[t]===e&&(l[t]=e)}),l.length>1&&l.index<r.length&&Array.prototype.push.apply(o,l.slice(1)),h=l[0].length,a=c;if(o.length>=s)break}i.lastIndex===l.index&&i.lastIndex++}return a===r.length?(h||!i.test(""))&&o.push(""):o.push(r.slice(a)),o.length>s?o.slice(0,s):o},r}();var i=/%(?![0-9A-Fa-f]{2})/,o=[".",",",":",";"],u=[".",",",":",";",".)"],a=[["(",")"],["<",">"],["&lt;","&gt;"]],f=[["(",")"],["<",">"],["&lt;","&gt;"],["\u201c","\u201d"],["\u2018","\u2019"]],l=/(\s+)/,c=/([\s<>"]+)/,h=/^https?:\/\/\w/,p=/^www\.|^(?!http)\w[^@]+\.(com|edu|gov|int|mil|net|org)$/,d=/^\S+@\S+\.\S+$/;return g.test={},g.test.split=e,g.test.convert_arguments=m,g}()

/**
 * Copyright (c) Mozilla Foundation http://www.mozilla.org/
 * This code is available under the terms of the MIT License
 */
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function") {
            throw new TypeError();
        }

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}


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
                scrollwheel: false,
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
             PNWMOTHS.Map.openIB.addTab('Site', "<br /><br /><br /><br /><br />"); 
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
              strokeColor: "#333",
              clickable: false,
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
            jQuery(controlDiv).addClass('gmnoprint');
            
            var fullscreenControl = PNWMOTHS.Map.control(controlDiv, "Click to go fullscreen", "Fullscreen");
            google.maps.event.addDomListener(fullscreenControl, 'click', function() {
                  var c = map.getCenter();
                  var b = map.getBounds();

			window.scrollTo(0,0);
			// hack until I come up with a callback for ScrollTo
			// for safari
			setTimeout(function() {
			  jQuery("html").toggleClass("fullscreen");
			  jQuery("#googlemap").toggleClass("fullscreen");
			  google.maps.event.trigger(map, 'resize');
			    var fullscreen = jQuery("#googlemap").hasClass("fullscreen");
			  map.setCenter(c);
			  if(fullscreen)
			      this.children[0].innerHTML = '<b>Exit Fullscreen</b>';
			  else
			      this.children[0].innerHTML = '<b>Fullscreen</b>';
			}, 100);
            });
            
            var toggleBoundariesControl = PNWMOTHS.Map.control(controlDiv, "Click to toggle county lines", "Counties");
                jQuery(toggleBoundariesControl).toggle(function() { PNWMOTHS.Map.counties.setMap(map); }, function() { PNWMOTHS.Map.counties.setMap(null); });
            
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);

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
            if(!record["notes"])
                record["notes"] = "";
            notesHtml = '<div id="IB_notes" class="infowindow collections"><p>' + urlize(record["notes"],undefined,undefined,undefined,"_blank",true).replace(/\r\n/g, "<br />").replace(/\n/g, "<br />") + "</p></div>";

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

		    // add multiple notes
		   if(typeof(groupedData[key]["notes"]) === "undefined"){
			groupedData[key]["notes"] = "";
		   }
		   if(data[i]["notes"]){
			groupedData[key]["notes"] += data[i]["notes"] + "\n";
		   }

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
                // Add link to collection if the field exists
                var collection = record.collection;
                if (record.collection && record.collection__url)
                    collection = '<a href="'+record.collection__url+'" target="_blank">' + record.collection + '</a>';
                return [date, record.collector, collection];
            }

            return null;
        },
        renderDate: function (record) {
            // Render a date string for a given record.
            var month_choices = ["Jan", "Feb", "Mar", "Apr",
                                 "May", "Jun", "Jul", "Aug",
                                 "Sep", "Oct", "Nov", "Dec"];

	    var r = [];
	    if (record.month)
		r.push(month_choices[record.month - 1]);
	    if (record.day)
		r.push(record.day);
	    if (record.year)
		r.push(record.year);
	    r = r.join(" ");
	    if (r == "")
		r = "None";
	    return r;
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
        "filterData": function (data, filters) {
            var filtered_data = data,
                filter;

            filtered_data = filtered_data.filter(function(record) {
                for (filter in filters) {
                    if (filters.hasOwnProperty(filter)) {
                        var d = record[filter];
                        var f = filters[filter];
                        if (filter == "elevation") {
                                if (d == null || (d != null && (d < f[0] || d > f[1])))
                                        return false;
                        }
                        else if (filter == "date") {
                          if (record["year"] == null)
                              return false;

                          if (record["year"] != null && (record["year"] < f[0].getFullYear() || record["year"] > f[1].getFullYear())) {
                             return false;
                          } else if (record["year"] != null && (record["year"] == f[0].getFullYear() || record["year"] == f[1].getFullYear())) {
                            if (record["month"] != null && (record["month"] < f[0].getMonth()+1 || record["month"] > f[1].getMonth()+1)) {
                                return false;
                            } else if (record["month"] != null && (record["month"] == f[0].getMonth()+1 || record["month"] == f[1].getMonth()+1)) {
                              if (record["day"] != null && (record["day"] < f[0].getDate() || record["day"] > f[1].getDate()))
                                  return false;
                            }
                          }
                        }
                        else {
                            var hit = false;
                            for (var j = 0; j < f.length; j++) {
                                if (f[j] == "None (CANADA)")
                                    f[j] = null;
                                if ((d == f[j]) || (d != null && f[j] != null && (""+d).toLowerCase() == (""+f[j]).toLowerCase()))
                                    hit = true; 
                            }
                            if (!hit)
                                return false;
                        } 
                    }
                }
                return true;
            });

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
                            classes: name + "-ms",
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
                reset: function(filter_delete) {
                    if (jQuery("#f-" + name).multiselect("getChecked").length)
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
            name = "date";
            var bounds = filterConfig.bounds;
            var ajaxPopulate = filterConfig.ajax;
            var finishInit = function(bounds) {
                    jQuery("#f-" + name).dateRangeSlider({defaultValues:bounds,
                                                          bounds: bounds, arrows: false});   
                    // Change handler
                    jQuery("#f-" + name).bind("valuesChanged", function(event, ui) {
						PNWMOTHS.Filters.filters[name] = [ui.values.min, ui.values.max];

                                                var minDate = new Date(bounds.min);
                                                minDate.setDate(minDate.getDate()+1);
                                                var maxDate = new Date(bounds.max);
                                                maxDate.setDate(maxDate.getDate()-1);
                                                if (ui.values.min < minDate && ui.values.max > maxDate) {
                                                      delete PNWMOTHS.Filters.filters[name];
                                                }
						jQuery(document).trigger("requestData");
					});
                    
            };

            return {
                initialize: function () {
		    if (!ajaxPopulate) {
			finishInit(bounds);
		    }
                    return jQuery("#f-" + name);
                },
                ajaxPopulate: ajaxPopulate,
                populate: function (event, data) {
					jQuery(this).unbind(event);
                    
                    finishInit({min: new Date(Date.parse(data["dates__min"])), max: new Date(Date.parse(data["dates__max"]))});
                },
                reset: function(filter_delete) {
                    var m = jQuery("#f-" + name);
                    var b = m.dateRangeSlider("bounds");
                    m.dateRangeSlider("values", b.min, b.max); 
                    if (filter_delete) {
                        delete PNWMOTHS.Filters.filters[name];
                    }
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
	    name = "elevation";
            var bounds = filterConfig.bounds ;
	    var ajaxPopulate = filterConfig.ajax;
	    var finishInit = function(bounds) {
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
	    };

            return {
                initialize: function () {
		    if (!ajaxPopulate) {
			finishInit();
		    }
                    
                    return jQuery("#f-" + name);
                },
                ajaxPopulate: ajaxPopulate,
		populate: function(event, data) {
					jQuery(this).unbind(event);
                    finishInit({min: data["elevation__min"], max: data["elevation__max"]});
		},
                reset: function(filter_delete) {
                    var m = jQuery("#f-" + name);
                    var b = m.editRangeSlider("bounds");
                    m.editRangeSlider("values", b.min, b.max); 
                    if (filter_delete) {
                        delete PNWMOTHS.Filters.filters[name];
                    }
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
			{"name": "record_type", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Voucher Types", "selectedText": "Filtering on # types", "ajax": true},
			{"name": "range", "type": PNWMOTHS.Filters.DateRangeFilter, "ajax": true},
			{"name": "year", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Years", "selectedText": "Filtering on # years", "ajax": true},
			{"name": "month", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Months", "selectedText": "Filtering on # months", "ajax": true},
			{"name": "day", "type": PNWMOTHS.Filters.MultiSelectFilter, "noneSelectedText": "Days", "selectedText": "Filtering on # days", "ajax": true},
			{"name": "range", "type": PNWMOTHS.Filters.EditRangeFilter, "ajax": true}
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
                        f.reset(false);
                    });
                    PNWMOTHS.Filters.filters = []; 
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
