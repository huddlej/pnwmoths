# CouchDB dokuwiki plugin

Renders the output of any CouchDB GET request.

## Usage

Display a list with view arguments (note: parameters with spaces need to be wrapped in escaped quotes):

    <couchdb>{"url": "/mydb/_design/mydesign/_list/mylist/myview", "params": {"include_docs": "true", "key": "\"my key\""}}</couchdb>

Display a show:

    <couchdb>{"url": "/mydb/_design/mydesign/_show/myshow/mydocid"}</couchdb>