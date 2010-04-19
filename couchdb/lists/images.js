function (head, req) {
    provides("html", function () {
        var row,
            imageUrl = "http://localhost/~huddlej/getFile.php",
            attachment,
            imageSrc;
        while (row = getRow()) {
            if (row.doc) {
                for (attachment in row.doc._attachments) {
                    imageSrc = imageUrl + "?id=" + row.id + "/" + attachment;
                    send("<li><a href='" + imageSrc + "'><img src='" + imageSrc + "' /></a></li>");
                 }
            }
        }
    });
}