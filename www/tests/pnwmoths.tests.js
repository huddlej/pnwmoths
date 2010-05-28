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
     });