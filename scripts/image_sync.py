#!/usr/bin/env python
import logging
import os
import sys

# Setup Django environment.
path = "/usr/local/www/pnwmoths/django"
sys.path.append(path)
os.environ['DJANGO_SETTINGS_MODULE'] = "pnwmoths.settings"

from django.conf import settings
from pnwmoths.species.models import Species, SpeciesImage
from bulkops import insert_many

logger = logging.getLogger("sync_media")
SIZES = {
    "thumbnail": 140,
    "medium": 375
}


def sync_media(database):
    """
    Sync images on the filesystem with the record of images in the database.

    Any images on the filesystem that don't exist in the database should have
    new database entries. Any images in the database that no longer exist on the
    filesystem should be deleted from the database.
    """
    files = _get_files()

    # Delete image records that don't have files on the filesystem.
    docs = SpeciesImage.objects.exclude(file__in=files)
    logging.info("Deleting %i files from database", docs.count())
    docs.delete()

    # Update images in the database that have changed on the filesystem.
    files_in_db = set(SpeciesImage.objects.filter(file__in=files).value_list("file", flat=True))
    files = set(files)
    files_not_in_db = files - files_in_db

    # Create SpeciesImage instances for files that are in the filesystem but not
    # the database.
    objects = []
    for filename in files_not_in_db:
        kwargs = {
            "file": filename,
            "species": _get_species_for_file(filename)
        }
        objects.append(SpeciesImage(**kwargs))

    # Save new records in one query.
    insert_many(objects, "pnwmoths")


def _get_species_for_file(file):
    return file.split("-")[0]


def _get_files(path=None):
    if not path:
        path = settings.CONTENT_ROOT

    files = []
    dirlist = os.listdir(path)

    for item in dirlist:
        file = os.path.join(path, item)
        if os.path.isdir(file):
            files = files + _get_files(file)
        elif os.path.isfile(file):
            files.append(file)

    files.sort()
    return files


if __name__ == "__main__":
    sync_media("pnwmoths")
