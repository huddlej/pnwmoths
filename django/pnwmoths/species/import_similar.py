import json
import operator

from django.db.models import Q
from models import Species


def import_similar(filename):
    fh = open(filename, "r")
    data = json.load(fh)
    fh.close()
    print "Found %i rows" % data["total_rows"]

    similar_by_species = {}
    unique_species = set()
    for row in data["rows"]:
        species = row["doc"]["species"]
        similar_species = row["doc"]["similar_species"]
        if species == "None" or similar_species == "None":
            print "Null value for row: %s" % row
            continue

        unique_species.add(tuple(species.split(" ")))
        unique_species.add(tuple(similar_species.split(" ")))

        similar_by_species.setdefault(species, set()).add(similar_species)

    species_queries = [Q(genus=i[0], species=i[1]) for i in unique_species]
    species_filter = reduce(operator.or_, species_queries)
    species = Species.objects.filter(species_filter)
    print "Loaded %i unique species" % species.count()
    species_by_fullname = dict([(unicode(s), s) for s in species])

    # Create species that didn't exist yet.
    # TODO: check for spelling mistakes
    for i in unique_species:
        if " ".join(i) not in species_by_fullname:
            print "Couldn't find %s %s" % i

    for species_name, similars in similar_by_species.items():
        species = species_by_fullname[species_name]
        similar_species = [species_by_fullname[s] for s in similars]
        #species.similar.add(*similar_species)
        print "%s: %s" % (species, ", ".join(map(str, similar_species)))
