function (doc) {
    var label_fields = ["collector", "collection"],
        label_values;
    if (doc.type == "image" && doc.species) {
        emit([doc.species, doc._id.split("-")[1], 1], {"id": doc._id,
                           "caption": doc.caption || ""});
    }
    else if (doc.type == "label" && doc.species) {
        label_values = [];
        for (i in label_fields) {
            if (doc[label_fields[i]]) {
                label_values.push(label_fields[i] + ": " + doc[label_fields[i]]);
            }
        }
        emit([doc.species, doc._id.split("-")[1], 0], label_values.join("\n"));
    }
}
