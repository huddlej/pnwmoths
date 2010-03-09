function (doc) {
    if (doc.similar_species) {
        emit(doc.species, doc.similar_species);
    }
}