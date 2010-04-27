function (head, req) {
    provides("html", function () {
        var row,
            image_url,
            image_src,
            image,
            attachment,
            first_row = true;

        // The image url provided in the GET query tells the list where to find
        // the attached images from a web-accessible path.
        if (req.query.image_url) {
            image_url = req.query.image_url;

            send("<div id='images'>");

            while (row = getRow()) {
                if (row.doc) {
                    for (attachment in row.doc._attachments) {
                        image_src = image_url + "?id=" + row.id + "/" + attachment;
                        image = "<img src='" + image_src + "' title='" + (row.doc.caption || "") + "' />";

                        if (first_row) {
                            send("<div id='current-image'>" + image + "</div>");
                            send("<ul id='other-images' class='jcarousel-skin-tango'>");
                            first_row = false;
                        }

                        send("<li>");
                        send("<a href='" + image_src + "'>");
                        send(image);
                        if (req.query.show_title) {
                            send("<br />" + row.doc.species);
                        }
                        send("</a>");
                        send("</li>\n");
                     }
                }
            }

            send("</ul>");
            send("</div>");
        }
    });
}