import datetime
import simplejson
from Levenshtein import distance
import operator
import pprint
import re

from django.db.models import Q
from management.commands.bulkops import insert_many
from models import (
    Collection,
    Collector,
    County,
    Species,
    SpeciesRecord,
    State
)


def get_data(filename):
    fh = open(filename, "r")
    data = simplejson.load(fh)
    fh.close()
    print "Found %i rows" % data["total_rows"]
    return data


def import_speciesrecords(filename, start=0):
    data = get_data(filename)
    total_records = data["total_rows"]

    unique_species = set()
    unique_states = set()
    unique_counties = set()
    unique_collections = set()
    unique_collectors = set()
    for row in data["rows"]:
        doc = row["doc"]

        if doc.get("genus") and doc.get("species"):
            unique_species.add((doc["genus"], doc["species"]))

        if doc.get("state"):
            # Force states to two uppercased characters.
            state = doc["state"][:2].upper()
            unique_states.add(state)
            if doc.get("county"):
                unique_counties.add((state, doc["county"]))

        if doc.get("collection"):
            unique_collections.add(doc["collection"])

        if doc.get("collector"):
            unique_collectors.add(doc["collector"])

    ##################################
    # Species
    #
    # Get primary keys by values.
    queries = [Q(genus=i[0], species=i[1]) for i in unique_species]
    query_filter = reduce(operator.or_, queries)
    species = Species.objects.filter(query_filter)

    # Separate non-existent records into their own group.
    species = dict([((i.genus, i.species), i.id) for i in species])
    nonexistent = unique_species - set(species.keys())

    # Create non-existent records.
    for s in nonexistent:
        instance = Species.objects.create(genus=s[0], species=s[1])
        species[s] = instance.id
    print "Created %i species" % len(nonexistent)

    ##################################
    # States
    #
    # Get primary keys by values.
    queries = [Q(code=i) for i in unique_states]
    query_filter = reduce(operator.or_, queries)
    instances = State.objects.filter(query_filter)

    # Separate non-existent records into their own group.
    states = dict([(i.code, i.id) for i in instances])
    nonexistent = unique_states - set(states.keys())

    # Create non-existent records.
    for s in nonexistent:
        instance = State.objects.create(code=s)
        states[s] = instance.id
    print "Created %i states" % len(nonexistent)

    ##################################
    # Counties
    #
    # Get primary keys by values.
    queries = [Q(state__code=i[0], name=i[1]) for i in unique_counties]
    query_filter = reduce(operator.or_, queries)
    instances = County.objects.filter(query_filter)

    # Separate non-existent records into their own group.
    counties = dict([((i.state.code, i.name), i.id) for i in instances])
    nonexistent = unique_counties - set(counties.keys())

    # Create non-existent records.
    for s in nonexistent:
        instance = County.objects.create(state_id=states[s[0]], name=s[1])
        counties[s] = instance.id
    print "Created %i counties" % len(nonexistent)

    ##################################
    # Collectors
    #
    # Get primary keys by values.
    queries = [Q(name=i) for i in unique_collectors]
    query_filter = reduce(operator.or_, queries)
    instances = Collector.objects.filter(query_filter)

    # Separate non-existent records into their own group.
    collectors = dict([(i.name, i.id) for i in instances])
    nonexistent = unique_collectors - set(collectors.keys())

    # Create non-existent records.
    for s in nonexistent:
        instance, created = Collector.objects.get_or_create(name=s)
        collectors[s] = instance.id
    print "Created %i collectors" % len(nonexistent)

    ##################################
    # Collections
    #
    # Get primary keys by values.
    queries = [Q(name=i) for i in unique_collections]
    query_filter = reduce(operator.or_, queries)
    instances = Collection.objects.filter(query_filter)

    # Separate non-existent records into their own group.
    collections = dict([(i.name, i.id) for i in instances])
    nonexistent = unique_collections - set(collections.keys())

    # Create non-existent records.
    for s in nonexistent:
        instance, created = Collection.objects.get_or_create(name=s)
        collections[s] = instance.id
    print "Created %i collections" % len(nonexistent)

    records_created = 0
    records = []
    records_skipped = []
    records_per_update = 10000
    for row in data["rows"][start:]:
        doc = row["doc"]
        kwargs = {}

        # Set species.
        kwargs["species_id"] = species.get((doc["genus"], doc["species"]))
        if kwargs["species_id"] is None:
            records_skipped.append(doc)
            continue

        # Set lat/lng.
        now = datetime.datetime.now()
        kwargs.update({
            "latitude": doc.get("latitude") or 0,
            "longitude": doc.get("longitude") or 0,
            "date_added": now,
            "date_modified": now
        })

        # Set foreign key fields.
        if doc.get("collection"):
            kwargs["collection_id"] = collections.get(doc.get("collection"))

        if doc.get("collector"):
            kwargs["collector_id"] = collectors.get(doc.get("collector"))

        if doc.get("state"):
            state = doc["state"][:2].upper()
            kwargs["state_id"] = states.get(state)
            if doc.get("county"):
                kwargs["county_id"] = counties.get((state, doc.get("county")))

        if "males" in doc:
            try:
                kwargs["males"] = int(doc["males"])
            except ValueError:
                kwargs["males"] = None

        if "females" in doc:
            try:
                kwargs["females"] = int(doc["females"])
            except ValueError:
                kwargs["females"] = None

        # Pull integers out of date fields.
        int_regex = re.compile("\d+")
        for field in ("year", "month", "day"):
            if doc.get(field):
                match = int_regex.search(doc[field])
                if match:
                    kwargs[field] = match.group()

        # Set remaining fields.
        fields_by_name = {
            "city": "locality",
            "elevation": "elevation",
            "notes": "notes"
        }
        kwargs.update(dict([(model_field, doc[doc_field])
                            for doc_field, model_field in fields_by_name.items()
                            if model_field not in kwargs and doc.get(doc_field)]))

        records.append(SpeciesRecord(**kwargs))

        if (len(records) == records_per_update or
            records_created + len(records) == total_records):
            print "Inserting %i records" % len(records)
            insert_many(records, using="pnwmoths")
            records_created += len(records)
            records = []

    if len(records) > 0:
        print "Inserting %i records" % len(records)
        insert_many(records, using="pnwmoths")
        records_created += len(records)

    print "Inserted %i records out of %i total." % (records_created, total_records)
    print "Records skipped:"
    pprint.pprint(records_skipped)

def import_similar(filename):
    data = get_data(filename)
    similar_by_species = {}
    unique_species = set()

    records_skipped = []
    for row in data["rows"]:
        species = row["doc"]["species"]
        similar_species = row["doc"]["similar_species"]
        if species == "None" or similar_species == "None":
            records_skipped.append(row["doc"])
            continue

        unique_species.add(tuple(species.split(" ")))
        unique_species.add(tuple(similar_species.split(" ")))

        similar_by_species.setdefault(species, set()).add(similar_species)

    species_queries = [Q(genus=i[0], species=i[1]) for i in unique_species]
    species_filter = reduce(operator.or_, species_queries)
    species = Species.objects.filter(species_filter)
    species_by_fullname = dict([(unicode(s), s) for s in species])

    print "Loaded %i unique species" % species.count()
    print "Skipped %i records" % len(records_skipped)
    pprint.pprint(records_skipped)

    # Create species that didn't exist yet.
    for i in unique_species:
        if " ".join(i) not in species_by_fullname:
            matches = Species.objects.filter(
                genus__startswith=i[0][:2],
                genus__endswith=i[0][-2:],
                species__startswith=i[1][:2],
                species__endswith=i[1][-2:]
            )
            complete_name = u" ".join(i)
            min_match = 10
            min_match_species = None
            for match in matches:
                d = distance(complete_name, unicode(match))
                if d < min_match:
                    min_match = d
                    min_match_species = match

            if min_match_species and d < 3:
                species_by_fullname[complete_name] = min_match_species
            else:
                species = Species.objects.create(genus=i[0], species=i[1])
                species_by_fullname[complete_name] = species

    for species_name, similars in similar_by_species.items():
        species = species_by_fullname[species_name]
        similar_species = [species_by_fullname[s] for s in similars]
        species.similar.add(*similar_species)
        #print "%s: %s" % (species, ", ".join(map(str, similar_species)))


if __name__ == "__main__":
    import_similar("similarspecies.json")
    import_speciesrecords("speciesrecords.json")
