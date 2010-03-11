function (doc) {
    if (doc.type == "image") {
        emit(doc.species, null);
    }
}