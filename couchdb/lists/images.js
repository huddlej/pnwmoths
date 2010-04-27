function (head, req) {
    provides("html", function () {
        var row,
            image_url,
            attachment,
            image_src;

        // The image url provided in the GET query tells the list where to find
        // the attached images from a web-accessible path.
        if (req.query.image_url) {
            image_url = req.query.image_url;
            while (row = getRow()) {
                if (row.doc) {
                    for (attachment in row.doc._attachments) {
                        image_src = image_url + "?id=" + row.id + "/" + attachment;
                        send("<li><a href='" + image_src + "'><img src='" + image_src + "' /></a></li>");
                     }
                }
            }
        }
    });
}