//<![CDATA[
var map;
var mgr;
var county_boundaries_xml;
var sites = [];
var selected_species;
var unique_species;

var simple_icon = new GIcon(G_DEFAULT_ICON);
simple_icon.image = "icon.png";
simple_icon.shadow = "icon.png";
simple_icon.iconAnchor = new GPoint(8, 8);
simple_icon.infoWindowAnchor = new GPoint(8, 8);

// Create varably sized icons scaled by a certain amount.
var icon_sizes = [10, 12, 16, 24];
var icon_count = 4;
var icons = [];
for (var i = 0; i < icon_count; i++) {
  var icon = new GIcon(simple_icon);
  var size = icon_sizes[i];
  icon.iconSize = new GSize(size, size);
  icon.shadowSize = new GSize(size, size);
  icons.push(icon);
}

/*
 * Represents the date and location one or more individuals of a species were
 * observed.
 */
function Site() {
  // Create a Date object for the site using all available information.
  // This will simplify filtering by date by allowing the use of standard
  // comparators between two objects.
  if (this.year !== undefined && this.year.length > 0) {
    var year = parseInt(this.year);

    if (this.month !== undefined && this.month.length > 0) {
      var month = parseInt(this.month);

      if (this.day !== undefined && this.day.length > 0) {
        var day = parseInt(this.day);
      }
      else {
        var day = 1;
      }
    }
    else {
      var month = 1;
      var day = 1;
    }

    this.date = new Date(year, month - 1, day);
  }
  else {
    this.date = null;
  }

  this.display_date = function() {
    if (this.year && this.month && this.day) {
      return this.month + "/" + this.day + "/" + this.year;
    }
    else if(this.year && this.month)  {
      return this.month + "/" + this.year;
    }
    else {
      return this.year;
    }
  };

  this.species_name = function() {
    if (this.genus == "" || this.species == "") {
      return "";
    }

    return this.genus + " " + this.species;
  };

  this.collection_summary = function() {
    // Set the date for this marker.
    if (this.date) {
      var summary = this.display_date();
      if (this.collector) {
        summary += " by " + this.collector;

        if (this.number_of_males) {
          summary += ", " + this.number_of_males + " males";
        }

        if (this.number_of_females) {
          summary += ", " + this.number_of_females + " females";
        }

        if (this.collection) {
          summary += " (" + this.collection + ")";
        }
      }
      return summary;
    }

    return null;
  };
}

// All filters that can be applied to data set.
var month_choices = [["", ""],
                     [1, "January"],
                     [2, "February"],
                     [3, "March"],
                     [4, "April"],
                     [5, "May"],
                     [6, "June"],
                     [7, "July"],
                     [8, "August"],
                     [9, "September"],
                     [10, "October"],
                     [11, "November"],
                     [12, "December"]];
var all_filters = {"elevation": new Filter("elevation", "Elevation (ft.)",
                                           [new Field("startelevation"),
                                            new Field("endelevation")]),
                   "date": new DateFilter("date", "Date",
                                      [new Field("startyear"),
                                       new ChoiceField("startmonth",
                                                       {"choices": month_choices}),
                                       new Field("startday"),
                                       new Field("endyear"),
                                       new ChoiceField("endmonth",
                                                       {"choices": month_choices}),
                                       new Field("endday")
                                      ])};

function clearFilters() {
  //console.log("Clearing filters.");
  for (var key in all_filters) {
    all_filters[key].unset();
  }
}

function createMarker(point, number, html, marker_options) {
  var marker = new GMarker(point, marker_options);
  marker.value = number;

  GEvent.addListener(marker, "click", function() {
    map.openInfoWindowHtml(point, html);
  });
  return marker;
}

function createSpeciesName(marker) {
  if (!marker[c.genus] || !marker[c.species]) {
    return "";
  }

  return jQuery.trim(marker[c.genus]) + " " + jQuery.trim(marker[c.species]);
}

function addTerritoryBoundaries() {
  // Place a polygon around the area we're most interested in.
  var polygon = new GPolygon([
        new GLatLng(40, -109.5),
        new GLatLng(53, -109.5),
        new GLatLng(53, -126),
        new GLatLng(40, -126),
        new GLatLng(40, -109.5)
  ], "#0099ff", 2, 1, "#ccffff", 0.2);
  map.addOverlay(polygon);
}

function populateMapBySpecies(species) {
  selected_species = species;
  mgr.clearMarkers();
  var species_markers = [];
  var gps_pairs = {};
  var info_fields = ["site_name", "county", "state", "elevation"];

  // Build a set of unique latitude/longitude sites with a marker and a
  // digest of each site's description.
  for (var i = 0; i < sites.length; i++) {
    var site = sites[i];

    // Apply filters.
    var filters_match = true;
    for (key in all_filters) {
      if (all_filters[key].filter(site) === false) {
        filters_match = false;
        break;
      }
    }

    if (!filters_match || !site.latitude || !site.longitude) {
      continue;
    }

    // If this is the first unfiltered instance of this site, create the
    // site marker and start the description string.
    var gps_pair = [site.latitude, site.longitude];
    if (!gps_pairs[gps_pair]) {
      gps_pairs[gps_pair] = {"latitude": site.latitude,
                             "longitude": site.longitude,
                             "precision": site.precision,
                             "description": $("<table class='info'></table>"),
                             "collectors": []};
      gps_pairs[gps_pair].description.append($("<tr><th colspan='2'>" +
                                               site.species_name() +
                                               "</th></tr>"));
    }

    // Add a collection summary for this site if one exists.
    var collection_summary = site.collection_summary();
    if (collection_summary) {
      gps_pairs[gps_pair].collectors.push(collection_summary);
    }

    // Prepare the contents of the info window for this marker.  Each window
    // only needs one value for each field except for date fields which are
    // collected for the entire data set.
    for (key in info_fields) {
      if (gps_pairs[gps_pair][info_fields[key]]) {
        continue;
      }

      if (all_filters[info_fields[key]]) {
        var title = all_filters[info_fields[key]].title;
      }
      else {
        // If no title is defined, capitalize the first letter of the
        // key.
        var title = info_fields[key];
        title = title.replace(/_/, " ");
        title = title.substr(0, 1).toUpperCase() +
                title.substr(1, title.length - 1);
      }

      //console.log(info_fields[key] + ": " + site[info_fields[key]] + ", year: " + site['year']);

      // Display an empty string when a field is undefined.
      var value = "";
      if (site[info_fields[key]] !== undefined) {
        value = site[info_fields[key]];
      }
      gps_pairs[gps_pair][info_fields[key]] = $("<tr><td>" +
                                                title +
                                                "</td><td>" +
                                                value +
                                                "</td></tr>");
    }
  }

  // Add markers for each unique site.
  var j = 0;
  for (gps_pair in gps_pairs) {
    var point = new GLatLng(parseFloat(gps_pairs[gps_pair].latitude),
                            parseFloat(gps_pairs[gps_pair].longitude));
    var description = gps_pairs[gps_pair].description;
    for (key in info_fields) {
      if (gps_pairs[gps_pair][info_fields[key]]) {
        description.append(gps_pairs[gps_pair][info_fields[key]]);
      }
    }

    description.append($("<tr><td>GPS coordinates</td><td>" +
                         gps_pairs[gps_pair].latitude +
                         ", " +
                         gps_pairs[gps_pair].longitude +
                         "</td></tr>"));

    if (gps_pairs[gps_pair].collectors.length > 0) {
      //gps_pairs[gps_pair].collectors.sort();
      var collectors_list = $("<ul></ul>");
      for (collector in gps_pairs[gps_pair].collectors) {
        var c = gps_pairs[gps_pair].collectors[collector];
        //console.log(c);
        collectors_list.append($("<li>" + c + "</li>"));
      }
      var collectors_cell = $("<td colspan=\"2\"><h2>Collections</h2></td>");
      collectors_cell.append(collectors_list);
      description.append($("<tr id=\"collections\"></tr>").append(collectors_cell));
    }

    description = description.parent().html();
    var icon_index = getAccuracyIcon(gps_pairs[gps_pair].precision);
    marker_options = { icon: icons[icon_index] };
    species_markers.push(createMarker(point, j, description,
                                      marker_options));
    j++;
  }

  mgr.addMarkers(species_markers, 3, 10);
  mgr.refresh();

  return false;
}

function getAccuracyIcon(precision) {
  // Use different marker icon sizes that reflect accuracy to: 0.1 degrees,
  // 0.01, 0.001, and  0.0001 or better.
  var icon_index;

  if (precision == 1) {
    icon_index = 3;
  }
  else if(precision == 2) {
    icon_index = 2;
  }
  else if(precision == 3) {
    icon_index = 1;
  }
  else {
    icon_index = 0;
  }

  return icon_index;
}

function prepareLinks() {
  // Display a list of the unique species.
  var species_ul = $("<ul></ul>");
  for (i in unique_species) {
    species_a = $("<a href='#'>" + unique_species[i] + "</a>");
    species_a.click(function () {
                      $(this).parent().parent().find(".selected").removeClass("selected");
                      $(this).addClass("selected");
                      $("#status").text("Loading...");
                      getSites($(this).text());
                    });
    species_ul.append($("<li></li>").append(species_a));
  }
  $("#species").append(species_ul);

  // Display a checkbox to toggle whether county boundaries should be displayed
  // or not.
  var toggle_counties = $("<input type='checkbox' name='toggle_counties' id='toggle_counties' checked='checked' />");
  toggle_counties.change(
    function () {
      if ($(this).attr("checked") === true && county_boundaries_xml.isHidden()) {
        county_boundaries_xml.show();
      }
      else {
        county_boundaries_xml.hide();
      }
    }
  );
  $("#filters").before($("<form></form>").append($("<p><label for='toggle_counties'>Toggle county borders</label></p>").prepend(toggle_counties)));

  // Add link to clear all filters.
  var clear_filters_link = $("#clear-filters");
  clear_filters_link.click(
    function () {
      $("#filters .selected").removeClass("selected");
      $("#filters .all").addClass("selected");
      clearFilters();
      if (selected_species) {
        populateMapBySpecies(selected_species);
      }
      return false;
    });

  // Add links to remove specific filters.
  for (field in all_filters) {
    var filter = all_filters[field];
    clear_filter_link = $("#clear-filter-" + field);
    clear_filter_link.attr("name", field);

    clear_filter_link.click(function () {
      $(this).parent().parent().find(".selected").removeClass("selected");
      $(this).addClass("selected");
      var name = $(this).attr("name");
      all_filters[name].unset();
      if (selected_species) {
        populateMapBySpecies(selected_species);
      }
      return false;
    });

    var form = filter.prepare();
  }

  $("#filters").toggle();
  $(":text").labelify({labelledClass: "label-highlight"});
}

$(document).ready(function() {
  if (!GBrowserIsCompatible()) {
    $("#status").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
    return;
  }

  map = new GMap2(document.getElementById("map"));

  // Center on Washington State.
  map.setCenter(new GLatLng(46.90, -118.00), 5);
  map.addControl(new GLargeMapControl());
  map.addControl(new GMapTypeControl());
  map.addMapType(G_PHYSICAL_MAP);
  map.setMapType(G_PHYSICAL_MAP);
  addTerritoryBoundaries();

  county_boundaries_xml = new GGeoXml("http://www.biol.wwu.edu/~huddlej/pnwmoths/counties9.kml");
  map.addOverlay(county_boundaries_xml);

  // Setup manager to control the zoom levels at which markers are displayed.
  mgr = new MarkerManager(map);

  try {
    var title = $("#title").text();
    title = title.split(" - ");
    selected_species = title[0];
    getSites(selected_species);
  }
  catch(e) {
  }
});

// Google Maps tries to call load() onload no matter what so this needs to be
// defined to prevent a runtime error.
function load() {
}
//]]>
