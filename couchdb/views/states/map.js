function(doc) {
    if (doc.state) {
        emit(doc.state, null);
    }
}