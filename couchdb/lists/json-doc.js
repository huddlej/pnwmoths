function (head, req) {
    provides("html", function () {
        var row, rows = [];
        while (row = getRow()) {
            if (row.doc) {
                rows.push(row.doc);
            }
        }
        send(toJSON(rows));
    });
}