function (head, req) {
    // !code vendor/date.js
    provides("html", function () {
        var row, rows = [];
        while (row = getRow()) {
            if (row.doc) {
                if (row.doc.hasOwnProperty("state") && row.doc.state) {
                    row.doc.county = row.doc.county + " (" + row.doc.state + ")";
                }

                row.doc.latitude = Number(row.value.latitude);
                row.doc.longitude = Number(row.value.longitude);
                row.doc.site_name = row.value.site_name || "";
                row.doc.precision = row.value.precision || "";
                row.doc.date = getSortableDate(row.doc) || "";
                rows.push(row.doc);
            }
        }

        // Sort all records by date.
        rows.sort(function (a, b) {
            if (a.date == b.date) {
                return 0;
            }
            else if (a.date < b.date) {
                return -1;
            }
            else {
                return 1
            }
        });

        send(toJSON(rows));
    });
}