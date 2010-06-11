"""
Parsers for masterlist data.
"""
import csv


def get_data(filename):
    fh = open(filename, "r")
    reader = csv.reader(fh)
    rows = list(reader)
    fh.close()
    return rows


def get_data_by_columns(data, column_names):
    columns = data[0]
    data = data[1:]
    columns_by_index = dict([(columns.index(column_name), column_name)
                             for column_name in column_names])

    column_data = []
    for row in data:
        # Get all data from all requested columns and index it in a dictionary
        # by column name.
        column_data.append(dict([(columns_by_index[index], row[index])
                                 for index in columns_by_index]))

    return column_data


def get_feature(data, feature, feature_type=None):
    column_data = get_data_by_columns(data, ["Genus", "Species", feature])
    feature_data = []

    for row in column_data:
        name = "%s %s" % (row["Genus"], row["Species"])
        value = row[feature]

        if value == "y":
            feature_data.append((name, "1"))

    return feature_data
