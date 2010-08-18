import pprint
import os
import re
import sys

# Setup Django environment.
path = "/home/huddlej/pnwmoths/django"
sys.path.append(path)
os.environ['DJANGO_SETTINGS_MODULE'] = "pnwmoths.settings"

from cms.models import CMSPlugin, Page, Title
from cms.plugins.text.models import Text
from django.contrib.sites.models import Site
from django.template.defaultfilters import slugify

header_map = {
    6: "h1",
    5: "h2",
    4: "h3",
    3: "h4",
    2: "h5",
    1: "h6"
}

BASE_DIR = "/home/huddlej/pnwmoths-www/factsheets/"
files = os.listdir(BASE_DIR)
files.sort()

# try:
#     pprint.pprint(files)
# except IOError:
#     pass
# sys.exit()

language = "en"
site = Site.objects.all()[0]

for file in files:
    if "-" in file:
        print "Rename %s" % file
        continue

    file_pieces = file.split("_")
    if file.startswith("_") or len(file_pieces) < 2:
        continue

    # Convert "ampla.txt" to "ampla".
    file_pieces[-1] = file_pieces[-1].split(".")[0]
    page_name = " ".join(file_pieces).capitalize()

    # Check for an existing page.
    try:
        page = Page.objects.get(reverse_id=page_name)
        continue
    except Page.DoesNotExist:
        pass

    fh = open(os.path.join(BASE_DIR, file), "r")
    data = fh.read()
    fh.close()
    data = data.split("\n")
    new_data = []

    # Keep track of first h2.
    h2_found = False
    content_found = False

    for row in data:
        # Row is a header if it looks like "== something something ==" with
        # optional spaces between text and equal signs.
        header_re = r"(=+) ?([\s\w]+?) ?=+"
        match = re.match(header_re, row)

        if match:
            try:
                header = header_map[len(match.groups()[0])]
            except:
                print "header error"
                print row
                sys.exit()

            # Start collecting data from the first h2 onward.
            if header == "h2" and not h2_found:
                h2_found = True

            if h2_found:
                new_data.append(
                    "<%s>%s</%s>" % (header, match.groups()[1], header)
                )
        # Row is empty; skip it.
        elif row.strip() == "":
            continue
        # Row is non-empty, non-header (i.e., regular content).
        elif h2_found:
            new_data.append("<p>%s</p>" % row)
            if not "no economic importance" in row:
                content_found = True

    new_data = "\n".join(new_data)

    # Create new page but only publish the page if it has content.
    page = Page(
        site=site,
        reverse_id=page_name,
        template="cms/factsheet.html",
        published=content_found
    )
    parent = Page.objects.get(title_set__title="Browse")
    page.insert_at(parent, position="last-child")
    page.save()
    title = Title.objects.set_or_create(
        page,
        language,
        title=page_name,
        slug=slugify(page_name)
    )

    # Get the placeholder for the page's plugins.
    placeholder = page.placeholders.get(slot="factsheet")

    # Create a text plugin to hold the new data.
    plugin = CMSPlugin(
        language=language,
        plugin_type="TextPlugin",
        position=0,
        placeholder=placeholder
    )
    plugin.save()

    text = Text(body=new_data)

    # Assign plugin attributes to Text instance.
    plugin.set_base_attr(text)

    plugin.text = text
    plugin.text.save()
    print "Added %s (%s)" % (page_name, {True: "published", False: "hidden"}[content_found])
