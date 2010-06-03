function (head, req) {
    // !json templates.similar_species
    // !code vendor/mustache.js
    provides("html", function () {
        var row,
            view;

        send(Mustache.to_html(templates.similar_species.head));

        while (row = getRow()) {
            view = {"doc_id": row.id,
                    "species": row.key,
                    "similar_species": row.value};
            send(Mustache.to_html(templates.similar_species.row, view));
        }

        send(Mustache.to_html(templates.similar_species.foot));
    });
}