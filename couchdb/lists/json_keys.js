function (head, req) {
    provides("html", function () {
        var row, rows = [];
        while (row = getRow()) {
            if (typeof(row.key) !== "undefined") {
                rows.push(row.key);
            }
        }
        send(toJSON(rows));
    });
}