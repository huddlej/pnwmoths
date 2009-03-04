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

column_names = ("id", "family", "genus", "species", "longitude", "latitude",
                "state", "county", "city", "elevation", "elevation_units",
                "year", None, None, "collector", None, None, None, None, None)
host = "localhost"
port = 5984
db_name = "pnwmoths"
uri = "".join(["/", db_name, "/"])
headers = {"Content-type": "application/json"}

for i in xrange(len(rows)):
    row = rows[i]
    document = {}
    for j in xrange(len(row)):
        row_value = row[j].strip()
        try:
            row_value = int(row_value)
        except ValueError:
            pass

        if column_names[j] and row_value:
            document[column_names[j]] = row_value

    if len(document) > 0:
        # Add document to the database.
        connection = httplib.HTTPConnection(host, port)
        connection.request("POST", uri,
                           repr(document).replace("'", "\""), headers)
