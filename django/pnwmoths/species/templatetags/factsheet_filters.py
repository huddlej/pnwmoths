from django import template
from pnwmoths.species.models import State, SpeciesRecord, GlossaryWord
import json, re

register = template.Library()

@register.filter
def get_records(value):
    results = list(SpeciesRecord.records.filter(species=value).select_related('collector__name', 'collection__url', 'collection__name', 'county_name', 'state__code').values('collection__name', 'collection__url', 'collector__name', 'county__name', 'day', 'elevation', 'females', 'latitude', 'longitude', 'locality', 'males', 'month', 'notes', 'record_type', 'state__code', 'year'))

    renames = ['collection', 'collector', 'county']
    for d in results:
        # rename for json output
        for r in renames:
            d[r] = d["%s__name" % r]
            del d["%s__name" % r]
        # rename state, duplicate locality, add date
        d['state'] = d['state__code']
        del d['state__code']
        if d['county'] and d['state']:
            d['county'] += " (%s)" % d['state']
        d['site_name'] = d['locality']
        d['date'] = "%s/%s/%s" % (d['year'], d['month'], d['day'])

    return json.dumps(results)


@register.filter
def filters_json(value, arg):
    """
        Returns Array with extra values removed based on species
    """
    def _human_key(key):
        parts = re.split('(\d*\.\d+|\d+)', key)
        return tuple((e.swapcase() if i % 2 == 0 else float(e)) for i, e in enumerate(parts))

    if arg == "county":
        states = list(State.objects.all().values_list())
        state_lookup = dict()
        for p in states:
            s_id,code = p
            state_lookup[s_id] = code

        return str(sorted([str("%s (%s)" % (item[0], state_lookup.get(item[1], "CANADA"))).replace("'", "`") for item in set(value.speciesrecord_set.all().values_list('county__name', 'county__state'))])).replace("'", '"').replace("`", "'")
    # filter removes None elements, human sort sorts in expected order
    return str(sorted([str(str(item)[0].capitalize() + str(item)[1:]).replace("'", "`") for item in set(filter(None, value.speciesrecord_set.all().values_list(arg, flat=True)))], key=_human_key)).replace("'", '"').replace("`", "'")

@register.filter
def glossary_words_json(value):
    """
    Returns a JSON object of glossary information
    """
    gw = list(GlossaryWord.objects.values())
    gw.sort(key=lambda s: len(str(s['word'])), reverse=True)
    return json.dumps(gw)
