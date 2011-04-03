#!/usr/bin/env python

import os
import sys

# Setup Django environment.
path = "/usr/local/www/pnwmoths/django"
sys.path.append(path)
os.environ['DJANGO_SETTINGS_MODULE'] = "pnwmoths.settings"

from couchdbkit import Server
import logging
import Image

from django.conf import settings

logger = logging.getLogger("sync_media")
SIZES = {
    "thumbnail": 140,
    "medium": 375
}


def cleanup_db(database):
    server = Server(settings.COUCHDB_SERVER)
    logging.debug("Connecting to CouchDB server: %s", settings.COUCHDB_SERVER)
    db = server.get_or_create_db(database)
    logging.debug("Found database: %s", db)

    view = db.view("moths/by_species_image",
                   reduce=False,
                   include_docs=True)
    logging.debug("Found %i results in by_species_image view.", view.total_rows)

    bulk_docs = []
    for row in view:
        doc = row["doc"]
        doc["_deleted"] = True
        bulk_docs.append(doc)

    if len(bulk_docs) > 0:
        logging.info("Saving %i bulk docs.", len(bulk_docs))
        db.bulk_save(bulk_docs)
        db.compact()


def sync_media(database):
    server = Server(settings.COUCHDB_SERVER)
    logging.debug("Connecting to CouchDB server: %s", settings.COUCHDB_SERVER)
    db = server.get_or_create_db(database)
    logging.debug("Found database: %s", db)

    view = db.view("moths/by_species_image",
                   reduce=False,
                   include_docs=True)
    logging.debug("Found %i results in by_species_image view.", view.total_rows)

    docs = [row["doc"] for row in view]
    logging.debug("Found %i docs.", len(docs))

    files = _get_files()
    relative_files = [os.path.split(file)[1] for file in files]
    relative_files.sort()
    logging.debug(relative_files)

    bulk_docs = []
    for doc in docs:
        if doc["_id"] in relative_files:
            # Don't process files already in the database.
            relative_files.remove(doc["_id"])

            if not "type" in doc or not "species" in doc:
                doc.update({
                    "type": "image",
                    "species": _get_species_for_file(doc["_id"])
                })
                bulk_docs.append(doc)
                logging.debug("Updating file already in database: %s", doc["_id"])
            else:
                logging.debug("Skipping file already in database: %s", doc["_id"])
        else:
            # If the file is in the database and not in the filesystem, it needs
            # to be deleted.
            try:
                # Make sure all other sizes for this image are deleted.
                for size_name in SIZES.keys():
                    filename = os.path.join(settings.CONTENT_ROOT, size_name, doc["_id"])
                    _delete_file(filename)

                logging.info("Deleting file from database: %s", doc["_id"])
                doc["_deleted"] = True
                bulk_docs.append(doc)
            except UnicodeEncodeError, e:
                logging.error("Couldn't delete file '%s': %s", filename, e)

    # Process files not already in the database.
    for file in relative_files:
        doc = {
            "_id": file,
            "type": "image",
            "species": _get_species_for_file(file)
        }
        bulk_docs.append(doc)

        for size_name, size in SIZES.items():
            _create_image(input=file,
                          output=os.path.join(size_name, file),
                          size=size)

    if len(bulk_docs) > 0:
        logging.info("Saving %i bulk docs.", len(bulk_docs))
        db.bulk_save(bulk_docs)


def _get_species_for_file(file):
    return file.split("-")[0]


def _get_files(path=None):
    if not path:
        path = settings.CONTENT_ROOT

    files = []
    dirlist = os.listdir(path)

    # Don't process files in these directories
    for size_name in SIZES:
        if size_name in dirlist:
            dirlist.remove(size_name)

    for item in dirlist:
        file = os.path.join(path, item)
        if os.path.isdir(file):
            files = files + _get_files(file)
        elif os.path.isfile(file):
            files.append(file)

    return files


def _sizes_outdated(filename):
    if len(SIZES) > 0:
        # If the current file is newer than one of its modified versions, all
        # versions should be updated.
        return os.path.getmtime(os.path.join(SIZES[0], file)) < os.path.getmtime(filename)
    else:
        return False


def _create_or_update_sizes(filename):
    for size_name, size in SIZES.items():
        _create_image(input=filename,
                      output=os.path.join(size_name, filename),
                      size=size)


def _create_image(input, output, size):
    logging.debug("Creating %ipx image from %s to %s", size, input, output)
    input_file = os.path.join(settings.CONTENT_ROOT, input)
    output_file = os.path.join(settings.CONTENT_ROOT, output)

    if os.path.isfile(input_file) and not os.path.isfile(output_file):
        try:
            image = Image.open(input_file)
        except IOError, e:
            logging.error("Couldn't open file '%s': %s", input_file, e)
            return None

        image_ratio = image.size[0].__truediv__(image.size[1])

        if image_ratio >= 1:
            dimensions = (size, image.size[1].__truediv__(image.size[0]) * size)
        else:
            dimensions = (image.size[0].__truediv__(image.size[1]) * size, size)

        image.thumbnail(dimensions, Image.ANTIALIAS)
        _create_dir(output)
        image.save(output_file, "JPEG")


def _create_dir(file):
    path, filename = os.path.split(file)
    path = os.path.join(settings.CONTENT_ROOT, path)
    if not os.path.isdir(path):
        logging.debug("Creating directory: %s", path)
        os.makedirs(path)


def _delete_file(filename):
    # Look into os.removedirs to remove empty directories
    if os.path.isfile(filename):
        logging.debug("Removing file: %s", filename)
        os.remove(filename)


if __name__ == "__main__":
    sync_media("pnwmoths")
