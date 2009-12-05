function(doc) {
    var longitude_precision = 0,
        latitude_precision = 0;

    if(doc.elevation) {
        doc.elevation = parseInt(doc.elevation);
    }
    else {
        doc.elevation = "";
    }

    if(doc.longitude) {
        try {
            longitude_precision = doc.longitude.split(".")[1].length;
        }
        catch (e) {
        }
        doc.longitude = Number(doc.longitude).toFixed(1);
    }

    if(doc.latitude) {
        try {
            latitude_precision = doc.latitude.split(".")[1].length;
        }
        catch (e) {
        }
        doc.latitude = Number(doc.latitude).toFixed(1);
    }

    doc.precision = Math.min(longitude_precision, latitude_precision);
    doc.site_name = doc.city;
    emit(doc.genus + " " + doc.species, null);
}