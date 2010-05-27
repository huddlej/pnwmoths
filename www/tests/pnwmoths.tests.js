module("Chart");

test("Namespace",
     function () {
         ok(PNWMOTHS instanceof Object, "PNWMOTHS is an Object");
         ok(PNWMOTHS.Chart instanceof Object, "PNWMOTHS.Chart is an Object");
     });

test("Charts",
     function () {
         ok(PNWMOTHS.Chart.charts instanceof Object, "charts attribute is an object");
     });