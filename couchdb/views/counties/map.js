function(doc) {
    if (doc.county) {
        if (doc.state) {
            emit(doc.county + " (" + doc.state + ")", null);
        }
        else {
            emit(doc.county, null);
        }
    }
}