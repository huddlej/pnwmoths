function (head, req) {
    provides("html", function () {
        var row,
            imageUrl,
            attachment,
            imageSrc;

        // The image url provided in the GET query tells the list where to find
        // the attached images from a web-accessible path.
        if (req.query.image_url) {
            imageUrl = req.query.image_url;
            while (row = getRow()) {
                if (row.doc) {
                    for (attachment in row.doc._attachments) {
                        imageSrc = imageUrl + "?id=" + row.id + "/" + attachment;
                        send("<li><a href='" + imageSrc + "'><img src='" + imageSrc + "' /></a></li>");
                     }
                }
            }
        }
    });
}