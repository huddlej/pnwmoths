function (doc) {
    if (doc.type == "image" && doc.species) {
        emit(doc.species, null);
    }
}