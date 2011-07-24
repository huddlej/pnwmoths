from django.contrib.localflavor.ca.ca_provinces import PROVINCE_CHOICES
from django.contrib.localflavor.us.us_states import STATE_CHOICES
from django.db import models


class Species(models.Model):
    similar = models.ManyToManyField("self")


class State(models.Model):
    choices = STATE_CHOICES + PROVINCE_CHOICES
    code = models.CharField(choices=choices)


class County(models.Model):
    pass


class Collector(model.Model):
    pass


class Collection(model.Model):
    pass


class SpeciesRecord(models.Model):
    species = models.ForeignKey(Species)
    latitude = models.FloatField()
    longitude = models.FloatField()
    locality = models.CharField(null=True, blank=True)
    county = models.ForeignKey(County, null=True, blank=True)
    state = models.ForeignKey(State, null=True, blank=True)
    elevation = models.IntegerField(help_text="measured in feet", null=True,
                                    blank=True)
    year = models.IntegerField(null=True, blank=True, min_value=0)
    month = models.IntegerField(null=True, blank=True, min_value=1,
                                max_value=12)
    day = models.IntegerField(null=True, blank=True, min_value=1, max_value=31)

    collector = models.ForeignKey(Collector, null=True, blank=True)
    collection = models.ForeignKey(Collection, null=True, blank=True)
    males = models.IntegerField(null=True, blank=True)
    females = models.IntegerField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    date_added = models.DateTimeField()
    date_modified = models.DateTimeField()

    @property
    def date(self):
        try:
            date = datetime.date(self.year, self.month, self.day)
        except ValueError:
            date = None

        return date


class SimilarSpecies(models.Model):
    pass


class SpeciesImage(models.Model):
    pass
