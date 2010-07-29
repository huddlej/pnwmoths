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

            while (row = getRow()) {
                view = {"image_src": image_url + "?id=" + row.value.id + "/" + row.value.attachment,
                        "title": row.value.caption || "",
                        "first_row": first_row,
                        "show_title": req.query.show_title,
                        "species": row.key};
                send(Mustache.to_html(templates.lists.full_images.row, view));

                if (first_row) {
                    first_row = false;
                }
            }

            send(Mustache.to_html(templates.lists.full_images.foot));
        }
    });
}