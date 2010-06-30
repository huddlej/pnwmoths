function (doc) {
    if (doc.type == "image" && doc.species) {
        emit(doc.date_modified, null);
    }
}