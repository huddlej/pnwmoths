function (head, req) {
    // !json templates.lists
    // !code vendor/mustache.js
    provides("html", function () {
        var row,
            image_url,
            attachment,
            view;

        // The image url provided in the GET query tells the list where to find
        // the attached images from a web-accessible path.
        if (req.query.image_url) {
            image_url = req.query.image_url;
            while (row = getRow()) {
                if (row.doc) {
                    for (attachment in row.doc._attachments) {
                        view = {"image_url": image_url + "?id=" + row.id + "/" + attachment,
                                "species": row.doc.species,
                                "show_title": req.query.show_title,
                                "title": row.doc.caption || ""};
                        send(Mustache.to_html(templates.lists.images, view));
                     }
                }
            }
        }
    });
}