import datetime
from Levenshtein import distance
from sorl.thumbnail import ImageField
from tastypie.models import create_api_key

from django.conf import settings
from cms.models.fields import  PageField
from django.contrib.auth.models import User
from django.contrib.localflavor.ca.ca_provinces import PROVINCE_CHOICES
from django.contrib.localflavor.us.us_states import STATE_CHOICES
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from cms.models.pluginmodel import CMSPlugin

models.signals.post_save.connect(create_api_key, sender=User)


class State(models.Model):
    choices = STATE_CHOICES + PROVINCE_CHOICES
    code = models.CharField(unique=True, choices=choices, max_length=2)

    class Meta:
        ordering = ["code"]

    def __unicode__(self):
        return self.code


class County(models.Model):
    state = models.ForeignKey(State)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]
        unique_together = ("state", "name")
        verbose_name_plural = u"counties"

    def __unicode__(self):
        return u"%s (%s)" % (self.name, self.state.code)


class Collector(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __unicode__(self):
        return self.name


class Collection(models.Model):
    """
    Represents a location where a species record may be kept in storage.
    """
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __unicode__(self):
        return self.name

class Author(models.Model):
    authority = models.CharField(max_length=255, unique=True)
    
    class Meta:
        ordering = ['authority']

    def __unicode__(self):
        return self.authority


class SpeciesManager(models.Manager):
    def search_by_similar_name(self, genus, species):
        """
        Search for Species with a similarly spelled name as the given name.

        This method can help correct spelling mistakes in species names.
        """
        matches = self.filter(
            genus__startswith=genus[:2],
            genus__endswith=genus[-2:],
            species__startswith=species[:2],
            species__endswith=species[-2:]
        )
        complete_name = u" ".join((genus, species))
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


class Species(models.Model):
    """
    Represents a species with a near-constant genus and species name.
    NOC ID Accepted Formatting: 1234, 1234.1, 12-1234 or 12-1234.1

    TODO: handle general key/value attributes including discoverer/year,
    synonyms, location on plates, etc.
    """
    genus = models.CharField(max_length=255)
    species = models.CharField(max_length=255)
    common_name = models.CharField(max_length=255, blank=True, null=True)
    noc_id = models.CharField("NOC #", max_length=9, blank=True, null=True,
                              validators=[RegexValidator("(\d{2}\-)?\d{4}(\.\d{1})?", "Enter a valid NOC #")])
    authority = models.ForeignKey(Author, null=True, blank=True)
    similar = models.ManyToManyField("self", blank=True)
    factsheet = PageField(unique=True, blank=True, null=True)

    class Meta:
        ordering = ["genus", "species"]
        unique_together = ("genus", "species")
        verbose_name_plural = u"species"

    def __unicode__(self):
        name = u"%s %s" % (self.genus, self.species)

        return name

    @property
    def name(self):
        return unicode(self)

    def get_first_image(self):
        """
        Return the first image of this species' images if one exists and None
        otherwise.

        TODO: turn this into a m2m manager method for SpeciesImage
        """
        try:
            return self.speciesimage_set.all()[0]
        except (Exception):
            return None

class RecordManager(models.Manager):
    def get_query_set(self):
        return super(RecordManager, self).get_query_set().filter(speciesimage__isnull=True)

class LabelManager(models.Manager):
    def get_query_set(self):
        return super(LabelManager, self).get_query_set().filter(speciesimage__isnull=False)


class SpeciesRecord(models.Model):
    """
    Represents a single record of a species based on a combination of where and
    when the specimen was found and by whom. If a record is missing latitude and
    longitude coordinates, it is assumed to be a label.

    The following fields define a unique record despite the fact that most of
    these fields can be empty:

    species,
    latitude,
    longitude,
    year,
    month,
    day,
    collector,
    collection,
    notes
    """
    # Set the number of decimal points to include in longitude and latitude
    # values returned to the user.
    GPS_PRECISION = 2

    species = models.ForeignKey(Species)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    locality = models.CharField(null=True, blank=True, max_length=255)
    county = models.ForeignKey(County, null=True, blank=True)
    state = models.ForeignKey(State, null=True, blank=True)
    elevation = models.IntegerField(help_text="measured in feet", null=True,
                                    blank=True)
    year = models.IntegerField(null=True, blank=True)
    month = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(12)])
    day = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(31)])

    collector = models.ForeignKey(Collector, null=True, blank=True)
    collection = models.ForeignKey(Collection, null=True, blank=True)
    males = models.IntegerField(null=True, blank=True)
    females = models.IntegerField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    date_added = models.DateTimeField(editable=False)
    date_modified = models.DateTimeField(editable=False)

    # Managers
    objects = models.Manager()
    records = RecordManager()
    labels = LabelManager()

    class Meta:
        ordering = ("species", "latitude", "longitude")

    def __unicode__(self):
        if self.speciesimage_set.exists():
            return u"Label - %s"  % self.species
        else:
            try:
                return u"Record - %s at (%.2f, %.2f)" % (self.species, self.latitude, self.longitude)
            except (Exception):
                return u"Record - %s" % self.species
                
    def details_tostr(self):
        r = self

        s = "<strong>"
        if r.state:
            s += str(r.state)
        if r.county:
            s += " : " + str(r.county)
        s += "</strong>"
        if r.locality or r.elevation:
            s += "<br />"
        if r.locality:
            s += r.locality
        if r.elevation:
            s += ", " + str(r.elevation) + " ft"

        if r.latitude and r.longitude:
            s += "<br />"
            s += str(round(r.latitude, 1)) + ", " + str(round(r.longitude, 1))
        if s != "<strong></strong>":
            s += "<br />"
        else:
            s = ""
        return s

    @property
    def date(self):
        try:
            date = datetime.date(self.year, self.month, self.day)
        except ValueError:
            date = None

        return date

    def save(self, *args, **kwargs):
        if not self.date_added:
            self.date_added = datetime.datetime.now()
        self.date_modified = datetime.datetime.now()

        super(SpeciesRecord, self).save(*args, **kwargs)


class SpeciesImage(models.Model):
    """
    Represents an image of a specific species.
    """
    SPECIES_RE = r"(\w+ [-\w]+)-\w-\w.jpg"
    IMAGE_PATH = "moths/"
    SIZES = {
        "thumbnail": "140x93",
        "medium": "375x249"
    }

    species = models.ForeignKey(Species)
    # Image field manages the creation and deletion of thumbnails
    # automatically. When an instance of this class is deleted, thumbnails
    # created for this field are automatically deleted too.
    image = ImageField(upload_to=IMAGE_PATH)
    
    weight_docs = "Images with the smallest weight are shown first. If images share the same weight, they are then sorted alphabetically as a group."
    weight_docs += "<br /><br />In the following examples, each number represents an image's weight. The bracketed groupings are sorted alphabetically."
    weight_docs += "<br />Example 1: [-1,-1],[0,0,0],2,3"
    weight_docs += "<br />Example 2 (DEFAULT): [0,0,0,0,0]"
    weight = models.IntegerField(blank=True, null=False, default=0, help_text=weight_docs)
    record = models.ForeignKey(SpeciesRecord, blank=True, null=True, verbose_name="Label")

    class Meta:
        ordering = ['weight', 'image']

    def __unicode__(self):
        return u"%s - %s" % (self.species, self.image.name)

    def title(self):
        return self.species


    def specimen_details(self):
        return self.record.details_tostr()

    def license_details(self):
        r = self.record
        s = ""

        s += "%s, %s." % (r.date.strftime("%B %d, %Y"), r.collector)
        s += "<br />Specimen courtesy of %s" % r.collection
        s += "<br />Photograph copyright of ..."

        return s

class FeaturedMothImage(CMSPlugin):
    species =  models.ManyToManyField(Species)

    def __unicode__(self):
        return "FeaturedMothImagePlugin"

    def copy_relations(self, oldinstance):
        self.species = oldinstance.species.all()

# TODO: write unit tests for this class before adding it.
# class SpeciesImageMetadata(models.Model):
#     """
#     Represents key/value metadata associated with a specific species image.

#     Examples include order, orientation (ventral, dorsal, etc.), photographer,
#     developmental stage of the individual, etc.
#     """
#     key = models.CharField(max_value=255)
#     value = models.CharField(max_value=255)
