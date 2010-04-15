function(doc) {
    if (doc.county) {
        emit(doc.county, null);
    }
}