#!/usr/bin/env python
import logging
import Image
import os
import sys

# Setup Django environment.
path = "/usr/local/www/pnwmoths/django"
sys.path.append(path)
os.environ['DJANGO_SETTINGS_MODULE'] = "pnwmoths.settings"

from django.conf import settings
from pnwmoths.species.models import Species, SpeciesImage

logger = logging.getLogger("sync_media")
SIZES = {
    "thumbnail": 140,
    "medium": 375
}


# TODO: rethink the creation and maintenance of thumbnail images. There is
# probably a better way.
def sync_media(database):
    """
    Sync images on the filesystem with the record of images in the database.

    Any images on the filesystem that don't exist in the database should have
    new database entries. Any images in the database that no longer exist on the
    filesystem should be deleted from the database.
    """
    files = _get_files()

    # Load image records that don't have files on the filesystem.
    docs = SpeciesImage.objects.exclude(file__in=files)

    # Process files that will be deleted.
    #
    # TODO: move this code into a custom queryset delete method for
    # SpeciesImage.
    for doc in docs:
        # Make sure all other sizes for this image are deleted.
        for size_name in SIZES.keys():
            # Get path and base filename from image path.
            path, filename = os.path.split(doc.file)
            size_filename = os.path.join(path, size_name, filename)
            _delete_file(size_filename)

    # Remove files from the database that aren't in the filesystem.
    logging.info("Deleting %i files from database", docs.count())
    docs.delete()

    # Update images in the database that have changed on the filesystem.
    docs = SpeciesImage.objects.filter(file__in=files)
    for doc in docs:
        # Don't process files already in the database.
        files.remove(doc.file)
        logging.debug("Skipping file already in database: %s", doc)

        # Update alternate sized files if they are out of date compared to the
        # original image.
        if _sizes_outdated(doc.file):
            _create_or_update_sizes(doc.file)

    # Add files from the filesystem that aren't already in the database.
    for filename in files:
        kwargs = {
            "file": filename,
            "species": _get_species_for_file(filename)
        }
        SpeciesImage.objects.create(**kwargs)
        _create_or_update_sizes(filename)


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

    files.sort()
    return files


def _sizes_outdated(filename):
    if len(SIZES) > 0:
        # If the current file is newer than one of its modified versions, all
        # versions should be updated.
        alternate_filename = os.path.join(SIZES.keys()[0], filename)
        if os.path.isfile(alternate_filename):
            return os.path.getmtime(alternate_filename) < os.path.getmtime(filename)
        else:
            return True
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

    if os.path.isfile(input_file):
        # Delete the new file if it already exists (i.e., update it).
        _delete_file(output_file)

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

