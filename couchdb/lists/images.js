function (head, req) {
    provides("html", function () {
        var row,
            imageUrl = "http://localhost/~huddlej/getFile.php",
            attachment;
        send("<ul>");
        while (row = getRow()) {
            if (row._attachments) {
                for (attachment in row._attachments) {
                    send("<li><a href=''><img src='" + imageUrl + "?id=" + row.id + "/" + attachment + "' /></a></li>");
                }
            }
        }
        send("</ul>");
    });
}