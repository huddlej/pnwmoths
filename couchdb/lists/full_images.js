function (head, req) {
    // !json templates.lists.full_images
    // !code vendor/mustache.js
    provides("html", function () {
        var row,
            first_row = true,
            view,
            title;

        if (req.query.first_image) {
            first_image = true;
        }
        else {
            first_image = false;
        }

        while (row = getRow()) {
            // The first row in the collated set is a label whose value can be
            // used for the next rows' titles.
            if (row.key[2] == 0) {
                title = row.value.replace("\n", ", ");
            }
            else {
                view = {"image_src": req.query.image_url,
                        "image_name": row.value.id,
                        "first_row": first_row,
                        "first_image": first_image,
                        "show_title": req.query.show_title,
                        "species": row.key[0]};
                if (row.value.caption) {
                    view["title"] = "caption: " + row.value.caption + ", " + title;
                }
                else {
                    view["title"] = title;
                }
                send(Mustache.to_html(templates.lists.full_images.row, view));

                if (first_row) {
                    first_row = false;
                }
            }
        }

        if (first_row == false) {
            send(Mustache.to_html(templates.lists.full_images.foot));            
        }
    });
}