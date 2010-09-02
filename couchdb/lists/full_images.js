function (head, req) {
    // !json templates.lists.full_images
    // !code vendor/mustache.js
    provides("html", function () {
        var row,
            attachment,
            first_row = true,
            view;

        if (req.query.first_image) {
            first_image = true;
        }
        else {
            first_image = false;
        }

        while (row = getRow()) {
            view = {"image_src": req.query.image_url,
                    "image_name": row.value.id,
                    "title": row.value.caption || "",
                    "first_row": first_row,
                    "first_image": first_image,
                    "show_title": req.query.show_title,
                    "species": row.key};
            send(Mustache.to_html(templates.lists.full_images.row, view));

            if (first_row) {
                first_row = false;
            }
        }

        if (first_row == false) {
            send(Mustache.to_html(templates.lists.full_images.foot));            
        }
    });
}