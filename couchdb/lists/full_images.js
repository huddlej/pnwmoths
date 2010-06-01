function (head, req) {
    // !json templates.lists.full_images
    // !code vendor/mustache.js
    provides("html", function () {
        var row,
            image_src,
            attachment,
            first_row = true,
            view;

        // The image url provided in the GET query tells the list where to find
        // the attached images from a web-accessible path.
        if (req.query.image_url) {
            image_url = req.query.image_url;

            send(Mustache.to_html(templates.lists.full_images.head));

            while (row = getRow()) {
                if (row.doc) {
                    for (attachment in row.doc._attachments) {
                        view = {"image_src": image_url + "?id=" + row.id + "/" + attachment,
                                "title": row.doc.caption || "",
                                "first_row": first_row,
                                "show_title": req.query.show_title,
                                "species": row.doc.species};
                        send(Mustache.to_html(templates.lists.full_images.row, view));

                        if (first_row) {
                            first_row = false;
                        }
                     }
                }
            }

            send(Mustache.to_html(templates.lists.full_images.foot));
        }
    });
}