function (doc) {
    if (doc.type == "image" && doc.species) {
        emit(doc.species, {"id": doc._id,
                           "caption": doc.caption || ""});
    }
}