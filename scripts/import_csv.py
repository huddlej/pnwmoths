#!/usr/bin/env python

import csv
import httplib
import sys

if len(sys.argv) < 2:
    print "Usage: ./import_csv.py file.csv"
    sys.exit(1)

filename = sys.argv[1]
fh = open(filename, "r")
csv_reader = csv.reader(fh)
rows = [row for row in csv_reader]

column_names = ["id", "family", "genus", "species", "longitude", "latitude",
                "state", "county", "city", "elevation", "elevation_units",
                "year", "month", "day", "collector", "collection", "males",
                "females", "notes"]
host = "localhost"
port = 5984
db_name = "pnwmoths"
uri = "".join(["/", db_name, "/"])
headers = {"Content-type": "application/json"}
integer_fields = ["elevation"]
notes_index = column_names.index("notes")

# TODO: merge state into county name when storing in the database.
# TODO: calculate latitude/longitude precision and store it in a field
# TODO: calculate sortable date and store it

for i in xrange(len(rows)):
    row = rows[i]
    document = {}
    for j in xrange(len(row)):
        # Only store an attribute in the document if it has a value.
        row_value = row[j].strip()
        if row_value == "":
            continue

        # All fields with an index higher than the notes field are treated as
        # additional notes fields.
        if j > notes_index:
            column_name = "notes"
        else:
            column_name = column_names[j]

        if column_name in integer_fields:
            try:
                row_value = int(row_value)
            except ValueError:
                pass

        if not column_name in document:
            document[column_name] = row_value
        else:
            # Concatenate existing fields with line returns.
            document[column_name] = "\n".join([document[column_name], row_value])

    if len(document) > 0:
        # Add document to the database.
        connection = httplib.HTTPConnection(host, port)
        connection.request("POST", uri,
                           repr(document).replace("'", "\""), headers)
