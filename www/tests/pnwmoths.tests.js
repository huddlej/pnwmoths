module("Chart");

test("Namespace",
     function () {
         ok(PNWMOTHS instanceof Object, "PNWMOTHS is an Object");
         ok(PNWMOTHS.Chart instanceof Object, "PNWMOTHS.Chart is an Object");
     });

test("Chart",
     function () {
         ok(jQuery.isEmptyObject(PNWMOTHS.Chart.charts), "charts attribute is an empty object");
         ok(PNWMOTHS.Chart.initialize("chart-id", [], {}) instanceof Object, "initialize returns a jqPlot instance");
         ok(PNWMOTHS.Chart.render("chart-id", [[]], [], {}) instanceof Object, "render returns a jqPlot instance");
         equals(PNWMOTHS.Chart.prepareDataLabels(["J", "F"], 1).toString(), ["J", " ", "F", " "].toString(), "prepareDataLabels returns padded labels");
         equals(PNWMOTHS.Chart.prepareDataLabels(["J", "F"], 1, "-").toString(), ["J", "-", "F", "-"].toString(), "prepareDataLabels returns padded labels with custom padding value");
         equals(PNWMOTHS.Chart.flattenData([[1], [2], [3]]).toString(), [1, 2, 3], "flattenData flattens data");
         var data = [{"month": 1, "day": 1},
                     {"month": 1, "day": 15},
                     {"month": 1, "day": 16},
                     {"month": 2, "day": 1}],
             grouped_data = PNWMOTHS.Chart.sumDataByMonthAndSegment(data);
         equals(grouped_data[0][0], 1, "found one record for the first month and segment");
         equals(grouped_data[0][1], 2, "found two records for the first month and second segment");
         equals(grouped_data[1][0], 1, "found one record for the second month and first segment");
         equals(grouped_data[2][0], 0, "no records set for the third month and first segment");
     });

module("Maps");

test("Namespace",
     function () {
         ok(PNWMOTHS instanceof Object, "PNWMOTHS is an Object");
         ok(PNWMOTHS.Map instanceof Object, "PNWMOTHS.Map is an Object");
     });

test("Map",
     function () {
         PNWMOTHS.Map.map = PNWMOTHS.Map.initialize();
         ok(PNWMOTHS.Map.map instanceof GMap2, "Map initialize returns a Google map instance");
         ok(PNWMOTHS.Map.toggleBorders().length > 0, "borders loaded successfully and shown");
         ok(PNWMOTHS.Map.toggleBorders()[0].isHidden(), "borders hidden");
         ok(PNWMOTHS.Map.toggleBorders()[0].isHidden() == false, "borders shown again");
         ok(PNWMOTHS.Map.getFullscreenControl() instanceof GControl, "fullscreen control is a Google maps control");

         var data = [
                 {"latitude": 48.0, "longitude": 100.0, "site_name": "Test Site 1"},
                 {"latitude": 49.0, "longitude": 100.0, "site_name": "Test Site 2"}
             ],
             grouped_data = PNWMOTHS.Map.groupMarkerData(data);
         equals(
             grouped_data[[data[0].latitude, data[0].longitude]].site_name,
             data[0].site_name,
             "site name for first data point is set"
         );
         equals(
             grouped_data[[data[1].latitude, data[1].longitude]].site_name,
             data[1].site_name,
             "site name for second data point is set"
         );
         equals(
             grouped_data[[data[0].latitude, data[0].longitude]].collections.length,
             0,
             "collections for first data point is empty"
         );

         var renderedMarker = PNWMOTHS.Map.renderMarkerRecord({
             "site_name": "Test Site 1",
             "county": "Whatcom",
             "collections": [["1/15/2010", "Lars Crabo", "LC"],
                             ["2/15/2010", "Merrill Peterson", "MP"]]
         });
         equals(renderedMarker.length, 2, "rendered marker record has one value for both tabs");
         ok(renderedMarker[0].search(/Test Site 1/) > 0, "site name is in first marker tab html");
         ok(renderedMarker[0].search(/Whatcom/) > 0, "county name is in first marker tab html");
         ok(renderedMarker[1].search(/Lars Crabo/) > 0, "collector name is in second marker tab html");

         ok(PNWMOTHS.Map.createMarkers([]) == true, "create markers returns markers");
         ok(PNWMOTHS.Map.createMarker(new GLatLng(48.0, 100.0), 1, "") == true, "create marker returns Google marker instance");
         ok(PNWMOTHS.Map.buildMapIcons() == [], "build map icons returns map icons");
         ok(
             PNWMOTHS.Map.addTerritoryBoundaries(PNWMOTHS.Map.map) instanceof GLatLngBounds,
             "add territory boundaries returns a Google bounds instance"
         );
         ok(PNWMOTHS.Map.setButtonStyles({"style": {}}) == true, "set styles on button");

         equals(
             PNWMOTHS.Map.renderCollection({
                 "is_protected": true,
                 "year": "2010"
             }),
             null,
             "protected collection record is omitted"
         );
         equals(
             PNWMOTHS.Map.renderCollection({}),
             null,
             "dateless collection record is omitted"
         );
         equals(
             PNWMOTHS.Map.renderCollection({
                 "collector": "Lars Crabo",
                 "collection": "LC",
                 "year": "2010"
             }).length,
             3,
             "collection record is valid"
         );

         equals(PNWMOTHS.Map.renderDate({}), "", "nothing is returned");
         equals(PNWMOTHS.Map.renderDate({"year": "2010"}), "2010", "year is returned");
         equals(PNWMOTHS.Map.renderDate({"year": "2010", "month": "12"}), "Dec 2010", "month and year is returned");
         equals(PNWMOTHS.Map.renderDate({"year": "2010", "month": "12", "day": "1"}), "Dec 1 2010", "month, day, and year is returned");
     });