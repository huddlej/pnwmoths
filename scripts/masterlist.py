"""
Parsers for masterlist data.
"""
import csv
import itertools
import re


def get_data(filename):
    """
    Get a list of CSV data from a filename.
    """
    fh = open(filename, "r")
    reader = csv.reader(fh)
    rows = list(reader)
    fh.close()
    return rows


def get_data_by_columns(data, column_names):
    columns = data[0]
    data = data[1:]

    # Build a list of column names by expanding any column name with a "%" into
    # all column names that match that general pattern. All columns without that
    # notation are listed as is. The list comprehension below takes advantage of
    # the Python "and/or" syntax where the last value of the first true
    # expression is returned.
    #
    # For example:
    # get_data_by_columns(data, ["Species", "FW Color%"]) ->
    # ["Species", "FW color (Bob)", "FW color (Joe)", "FW color (Sammy)"]
    column_names = ["%" in column and
                    filter(lambda x: bool(re.match(column.replace("%", ""), x)), columns) or
                    [column]
                    for column in column_names]
    column_names = itertools.chain(*column_names)

    columns_by_index = dict([(columns.index(column_name), column_name)
                             for column_name in column_names])

    column_data = []
    for row in data:
        # Get all data from all requested columns and index it in a dictionary
        # by column name.
        column_data.append(dict([(columns_by_index[index], row[index])
                                 for index in columns_by_index]))

    return column_data


def get_feature(data, feature):
    """
    Given a list of data rows return the data associated with the given
    ``feature`` which is also a column name.

    If more than one column is returned for the given feature, all values from
    all columns other than the "Genus" and "Species" will be merged into one
    column of unique values.
    """
    # Create a string of "myfeature%" to enable fuzzy matching of columns.
    feature = "%s%%" % feature

    column_data = get_data_by_columns(data, ["Genus", "Species", feature])
    feature_data = []

    keys = set()

    for row in column_data:
        name = "%s %s" % (row["Genus"], row["Species"])
        values = set()
        for key, value in row.items():
            if key not in ("Genus", "Species"):
                keys.add(key)
                values.update(value.split(","))

        for value in values:
            feature_data.append((name, value))

    print "Added values for keys:"
    print keys

    return feature_data


def get_sizes(data):
    """
    Gets average size values for all rows in given data set.
    """
    column_data = get_data_by_columns(data, ["Size%"])

    all_sizes = []
    for row in column_data:
        sizes = []
        for key, val in row.items():
            if val:
                pieces = map(float, val.split("-"))
                sizes.append(sum(pieces) / len(pieces))

        if sizes:
            all_sizes.append(sum(sizes) / len(sizes))

    return all_sizes
