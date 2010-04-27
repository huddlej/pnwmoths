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
                        send("<li>");
                        send("<a href='" + image_src + "'>");
                        send("<img src='" + image_src + "' title='" + (row.doc.caption || "") + "' />");
                        if (req.query.show_title) {
                            send("<br />" + row.doc.species);
                        }
                        send("</a>");
                        send("</li>\n");
                     }
                }
            }
        }
    });
}