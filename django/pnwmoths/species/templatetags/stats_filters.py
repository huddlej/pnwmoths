from django import template
from django.db.models import F
from cms.models.pagemodel import Page
from django.db.models.loading import get_model
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
            return get_model('species', value).records.count()
        return get_model('species', value).objects.count()
    except (Exception):
        return ""
