function (head, req) {
    provides("html", function () {
        var row, rows = [];
        while (row = getRow()) {
            if (row.doc) {
                row.doc.latitude = Number(row.doc.latitude);
                row.doc.longitude = Number(row.doc.longitude);
                row.doc.site_name = row.value.site_name;
                row.doc.precision = row.value.precision;
                rows.push(row.doc);
            }
        }
        send(toJSON(rows));
    });
}