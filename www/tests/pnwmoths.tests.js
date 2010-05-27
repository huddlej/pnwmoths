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
     });