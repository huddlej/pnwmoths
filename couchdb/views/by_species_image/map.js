function (doc) {
    if (doc.type == "image" && doc.species && doc._attachments) {
        for (attachment in doc._attachments) {
            emit(doc.species, {"id": doc._id,
                               "attachment": attachment,
                               "caption": doc.caption});
        }
    }
}