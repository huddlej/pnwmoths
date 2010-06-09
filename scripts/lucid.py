"""
Utilities for updating Lucid Builder keys for import into Lucid.

Process based on Lucid key XML:

 [x] create reciprocal mappings of entity ids to entity names
 [x] create reciprocal mappings of feature/state ids to feature/state names
 [ ] for each feature write a function to get the feature data from the masterlist for each species
 [x] create scoring_item sections for each feature with scored_item entries for each entity
"""
import elementtree.ElementTree as ET
import sys

if len(sys.argv) < 2:
#     print "Usage: ./lucid.py <filename>"
#     sys.exit(1)
    filename = "/home/huddlej/Desktop/Dropbox/pnwmoths-key-export.lif3"
else:
    filename = sys.argv[1]

print "Opening %s..." % filename

tree = ET.parse(filename)
items = list(tree.findall("items/item"))

entities_by_id = {}
entities_by_fullname = {}
features_by_id = {}
for i in items:
    if i.attrib["item_type"] == "entity":
        # Store names by id.
        entities_by_id[i.attrib["item_id"]] = i.attrib["name"]

        # Title capitalized names are genus names. These need to be prepended to
        # species names.
        if i.attrib["name"].istitle():
            genus = i.attrib["name"]
        else:
            # Create a full name from a genus name and a species name.
            name = "%s %s" % (genus, i.attrib["name"])
            entities_by_fullname[name] = i.attrib["item_id"]
    elif i.attrib["item_type"] == "feature":
        # Store names by id.
        features_by_id[i.attrib["item_id"]] = i.attrib["name"]

print "Found %s entities" % len(entities_by_id)
print entities_by_fullname.items()[:10]

print "Found %s features" % len(features_by_id)
print features_by_id.items()[:10]

class Feature(object):
    def __init__(self, id, entities):
        self.id = id
        self.entities = entities

root = tree.getroot()
descriptions = None
container = None

for e in list(root):
    if e.tag == "descriptions":
        descriptions = e
        print "Found descriptions"
        break

if descriptions is not None:
    for e in list(descriptions):
        if e.attrib["type"] == "normal":
            container = e
            print "Found container"
            break

if container is not None:
    features = [Feature("10", ["5", "6", "7"]),
                Feature("11", ["6", "8", "1"])]

    print list(container)
    for feature in features:
        scoring_item = ET.SubElement(container, "scoring_item")
        scoring_item.attrib["item_id"] = feature.id

        for entity in feature.entities:
            scored_item = ET.SubElement(scoring_item, "scored_item")
            scored_item.attrib.update({"item_id": entity,
                                       "value": "1"})
    print list(container)

    tree.write("%s.scr" % filename)

