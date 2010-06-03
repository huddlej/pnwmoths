function (doc, req) {
    // !json templates.similar_species
    // !code vendor/mustache.js
    var view = {};

    if (doc && doc.species && doc.similar_species) {
        view["species"] = doc.species;
        view["similar_species"] = doc.similar_species;
    }

    return Mustache.to_html(
        templates.similar_species.edit,
        view
    );
}