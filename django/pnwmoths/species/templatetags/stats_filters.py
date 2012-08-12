from django import template
from django.db.models import F
from cms.models.pagemodel import Page
from django.db.models.loading import get_model
from django.contrib.humanize.templatetags.humanize import intcomma
register = template.Library()

@register.filter
def species_stat_count(value):
    """
        Accepts a string for a model from species.models
        Returns the count of that model
        Handles SpeciesRecord model differently, returning the RECORD count
    """
    try:
        if value == 'SpeciesRecord':
            r_count = get_model('species', value).records.count()
        elif value == 'Species':
            # Shows only the published species accounts count
            r_count = Page.objects.published().filter(species__isnull=False).count()
        else:
            r_count = get_model('species', value).objects.count()
        # return formatted count
        return intcomma(r_count)
    except (Exception):
        return ""
