function (key, values) {
    values.sort(function (a, b) {
        if (a.attachment < b.attachment) {
            return -1;
        }
        else if (a.attachment > b.attachment) {
            return 1;
        }
        else {
            return 0;
        }
    });
    return values[0];
}