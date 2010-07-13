function (doc) {
    if (doc.similar_species) {
        // Emit a row for each pair to avoid redundant records in the database.
        emit(doc.species, doc.similar_species);
        emit(doc.similar_species, doc.species);
    }
}