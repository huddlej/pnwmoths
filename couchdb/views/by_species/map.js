function(doc) {
    if (doc.genus && doc.species) {
        emit(doc.genus + " " + doc.species, null);
    }
}