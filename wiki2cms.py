import pprint
import os
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
#     pprint.pprint(files[:3])
# except IOError:
#     pass
# sys.exit()

language = "en"
site = Site.objects.all()[0]
parent = Page.objects.get(title_set__title="Browse")

for file in files[:3]:
    file_pieces = file.split("_")
    if file.startswith("_") or len(file_pieces) < 2:
        continue

    if len(file_pieces) > 2:
        file_pieces = file_pieces[:2]
    else:
        file_pieces = [file_pieces[0], file_pieces[1].split(".")[0]]

    page_name = " ".join(file_pieces).capitalize()

    fh = open(os.path.join(BASE_DIR, file), "r")
    data = fh.read()
    fh.close()
    data = data.split("\n")
    new_data = []

    # Keep track of first h2.
    h2_found = False

    for row in data:
        # Row is a header.
        row_pieces = row.split(" ")
        if row_pieces[0].startswith("=") and row_pieces[-1].endswith("="):
            header = header_map[len(row_pieces[0])]

            # Start collecting data from the first h2 onward.
            if header == "h2" and not h2_found:
                h2_found = True

            if h2_found:
                new_data.append(
                    "<%s>%s</%s>" % (header, " ".join(row_pieces[1:-1]), header)
                )
        # Row is empty; skip it.
        elif row.strip() == "":
            continue
        # Row is non-empty, non-header (i.e., regular content).
        elif h2_found:
            new_data.append("<p>%s</p>" % row)

    new_data = "\n".join(new_data)

    # Create new page.
    page = Page(
        site=site,
        reverse_id=page_name,
        template="cms/factsheet.html",
        published=True
    )
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
