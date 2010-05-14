function (head, req) {
    provides("html", function () {
        var row, rows = [];
        while (row = getRow()) {
            rows.push(row);
        }
        send(toJSON(rows));
    });
}