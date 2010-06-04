function getSortableDate(record) {
    if (record.hasOwnProperty("year") && record.year &&
        record.hasOwnProperty("month") && record.month &&
        record.hasOwnProperty("day") && record.day) {
        date = [record.year, record.month, record.day];
    }
    else if (record.hasOwnProperty("year") && record.year &&
            record.hasOwnProperty("month") && record.month) {
        date = [record.year, record.month, "1"];
    }
    else if (record.hasOwnProperty("year") && record.year) {
        date = [record.year, "1", "1"];
    }
    else {
        date = [];
    }

    return date.join("/");
}