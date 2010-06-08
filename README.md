# PNW Moths

## Dependencies

 * [Zend Framework](http://framework.zend.com/)
 * [Tillikum CouchDB](http://github.com/strattg/tillikum-couchdb)
 * [dokuwiki](http://www.dokuwiki.org)
 * [jQuery](http://jquery.com)
 * [jCarousel](http://sorgalla.com/jcarousel/)
 * [jqPlot](http://www.jqplot.com)

### Dokuwiki Plugins

 * [templater](http://www.dokuwiki.org/plugin:templater)
 * [alphaindex](http://www.dokuwiki.org/plugin:alphaindex)

## CouchDB

The CouchDB design document used by this application are stored in the couchdb
directory. These files are designed for use with "couchapp", a Python utility
that maps filesystem directory structures to CouchDB design documents.

To add or updates the design documents in the PNW Moths database, run the
following command from the root directory of this project:

couchapp push moths couchdb http://localhost:5984/pnwmoths

The first argument to the push command is the name of the design document that
should be created in the database. The second argument is local directory
containing the design document.  The final argument is the complete URL of the
database the document is being pushed to.

### Collection Documents

    id,
    family,
    genus,
    species,
    subspecies,
    longitude,
    latitude,
    state,
    county,
    city,
    elevation,
    elevation_units,
    year,
    month,
    day,
    collector,
    collection,
    males,
    females,
    notes
