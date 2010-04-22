function (head, req) {
    provides("html", function () {
        var row;
        while (row = getRow()) {
            send(row.key + "<br />");
        }
    });
}