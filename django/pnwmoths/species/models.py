import datetime
import os
from Levenshtein import distance
from sorl.thumbnail import ImageField
import re

from django.conf import settings
from cms.models.pagemodel import Page
from cms.models.fields import  PageField, PlaceholderField
from django.contrib.auth.models import User
from django.contrib.localflavor.ca.ca_provinces import PROVINCE_CHOICES
from django.contrib.localflavor.us.us_states import STATE_CHOICES
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from cms.models.pluginmodel import CMSPlugin
from storage import OverwriteStorage
from django.db.models.signals import post_save
from django.utils.translation import ugettext_lazy as _

from cms.plugin_pool import plugin_pool
from cms.models.placeholdermodel import Placeholder


"""
MODEL DEFINITIONS
"""
class GlossaryImage(models.Model):
    """
    Represents an image that is attached to glossary words.
    """
    IMAGE_PATH = "glossary-images/"

    # TODO: REPLACE SORL WITH SOMETHING THAT DOESN"T PERMANENT CACHE!
    # Changing these dimensions will force sorl to recache thumbs
    # Used: 141x93, 376x249, 140x93, 375x249
    SIZES = {
        "thumbnail": "188x225",
        "medium": "750x900"
    }

    title = models.CharField(unique=True, max_length=255, blank=False)
    # Image field manages the creation and deletion of thumbnails
    # automatically. When an instance of this class is deleted, thumbnails
    # created for this field are automatically deleted too.
    image = ImageField(storage=OverwriteStorage(), upload_to=IMAGE_PATH, blank=False)
    
    def __unicode__(self):
        return self.title


class GlossaryWord(models.Model):
    word = models.CharField(unique=True, max_length=255, blank=False)
    definition = models.TextField(blank=False)
    image = models.ForeignKey(GlossaryImage, blank=True, null=True)

    class Meta:
        ordering = ["word"]

    def __unicode__(self):
        return self.word


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
    url = models.URLField(blank=True, null=True)

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

    TODO: handle general key/value attributes including discoverer/year,
    synonyms, location on plates, etc.
    """
    genus = models.CharField(max_length=255, db_index=True)
    species = models.CharField(max_length=255, db_index=True)
    common_name = models.CharField(max_length=255, blank=True, null=True)
    noc_id = models.CharField("NOC #", max_length=24, blank=True, null=True)
    authority = models.ForeignKey(Author, null=True, blank=True)
    similar = models.ManyToManyField("self", blank=True)
    factsheet = PageField(unique=True, blank=True, null=True)

    class Meta:
        ordering = ["noc_id"]
        unique_together = ("genus", "species")
        verbose_name_plural = u"species"

    def __unicode__(self):
        name = u"%s %s" % (self.genus, self.species)
        return name

    @property
    def name(self):
        return unicode(self)

    def get_ordered_images(self):
        """
        Returns a set of images order alphabetically,
        ignoring spaces, underscores, and numbers.
        These characters are added by the django admin and mess up the ordering
        on factsheets.
        """
        # Creates a list with the weight in front as it has a higher priority
        # over the name.
        qs = list(self.speciesimage_set.all())
        alphanum_key = lambda s: [s.weight, re.sub(r'[_ -0123456789]', '', s.image.name)]
        return sorted(qs, key=alphanum_key)

    def get_first_plate(self):
        """
        Returns the first imageplate's PK
        """
        try:
            return self.plateimage_set.all()[:1].get().pk
        except:
            return None

    def get_first_image(self):
        """
        Return the first image of this species' images if one exists and None
        otherwise.
        """
        try:
            return self.speciesimage_set.all()[:1].get()
        except (Exception):
            return None


class PlateImageManager(models.Manager):
    """
    Manager used to get image plates in human sorted order for display.
    """
    def _human_key(self, key):
        parts = re.split('(\d*\.\d+|\d+)', key)
        return tuple((e.swapcase() if i % 2 == 0 else float(e)) for i, e in enumerate(parts))

    def in_human_sorted_order(self, *args, **kwargs):
        qs = self.get_query_set().filter(*args, **kwargs)
        return sorted(qs, key=lambda x: self._human_key(x.image.name))


class PlateImage(models.Model):
    """
    An image plate (image with many moths).
    Maintains an ImageField, for thumbnails, and non-zoomify support
    as well as a FilePath for the zoomify folder.
    """

    objects = PlateImageManager()

    # Admin Help Docs
    z_image_docs = "Select the ImageProperties.xml file in the corresponding image folder."

    IMAGE_PATH = "plates/"
    ZOOM_PATH = "plates_z/"
    ZOOM_ABS_PATH = "%s%s" % (settings.MEDIA_ROOT, ZOOM_PATH)
    SIZES = {
        "thumbnail": "240x300",
        "medium": "480x600"
    }

    description = PlaceholderField('Description')
    image = ImageField(upload_to=IMAGE_PATH)
    z_image = models.FilePathField(path=ZOOM_ABS_PATH, recursive=True, match="ImageProperties.xml", max_length=200, help_text=z_image_docs, blank=True, null=True)
    member_species = models.ManyToManyField(Species)

    @property
    def zoomify_folder(self):
        """
        Returns the corresponding zoomify directory with ImageProperties.xml removed.
        """
        return "%s%s" % (ZOOM_PATH, os.path.split(os.path.dirname(self.z_image))[1])

    def __unicode__(self):
        return u"%s" % self.image.name


class Photographer(models.Model):
    """
    A photographer, used for image copyright information
    """
    photographer = models.CharField(max_length=100)

    class Meta:
        ordering = ['photographer']

    def __unicode__(self):
        return self.photographer

class FeaturedMothImage(CMSPlugin):
    species =  models.ManyToManyField(Species)

    def __unicode__(self):
        return "FeaturedMothImagePlugin"

    def copy_relations(self, oldinstance):
        self.species = oldinstance.species.all()



class RecordManager(models.Manager):
    def get_query_set(self):
        return super(RecordManager, self).get_query_set().filter(speciesimage__isnull=True).distinct()

class LabelManager(models.Manager):
    def get_query_set(self):
        return super(LabelManager, self).get_query_set().filter(speciesimage__isnull=False).distinct()

class SpeciesRecord(models.Model):
    """
    Represents a single record of a species based on a combination of where and
    when the specimen was found and by whom. If a record is missing latitude and
    longitude coordinates, it is assumed to be a label.

    Stores the csv filename it was uploaded with for ease of replacement and
    updating in the event that changes were made to a file without ids.
    """

    # Admin Docs
    gender_docs = "Negative values represent the count of unsexed specimens. -999999 means unsexed, uncounted."

    # Set the number of decimal points to include in longitude and latitude
    # values returned to the user.
    GPS_PRECISION = 2
    RECORD_TYPE_CHOICES = (
            ('specimen', 'Specimen'),
            ('photograph', 'Photograph'),
            ('literature', 'Literature'),
            ('sight_field_notes', 'Sight/Field Notes'),
    )

    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES, verbose_name='Voucher Type')
    species = models.ForeignKey(Species)
    type_status = models.CharField(null=True, blank=True, max_length=255)
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
    males = models.IntegerField(null=True, blank=True, help_text=gender_docs)
    females = models.IntegerField(null=True, blank=True, help_text=gender_docs)
    notes = models.TextField(null=True, blank=True)

    csv_file = models.CharField(null=True, blank=True, max_length=255)

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
            s += " : " + str(r.county.name) + " Co."
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
            return datetime.date(self.year, self.month, self.day)
        except Exception:
            return None

    @property
    def fuzzy_date(self):
        """ Assumes a year, otherwise defaults to jan 1st """
        try:
            m = self.month or 1
            d = self.day or 1
            return datetime.date(self.year, m, d)
        except Exception:
            return None

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
    ZOOM_PATH = "moths_z/"
    REARED_TERMS = ["reared","larva","em.","pupa","Rubus","immature","broadleaf","Taraxacum","ovum","emerged","emgd","em in","em ex","eggs"]

    # TODO: REPLACE SORL WITH SOMETHING THAT DOESN"T PERMANENT CACHE!
    # Changing these dimensions will force sorl to recache thumbs
    # Used: 141x93, 376x249, 140x93, 375x249
    SIZES = {
        "thumbnail": "141x93",
        "medium": "376x249"
    }
    
    # Help Docs
    photographer_docs = "Used as the copyright holder."

    weight_docs = "Images with the smallest weight are shown first. If images share the same weight, they are then sorted alphabetically as a group."
    weight_docs += "<br /><br />In the following examples, each number represents an image's weight. The bracketed groupings are sorted alphabetically."
    weight_docs += "<br />Example 1: [-1,-1],[0,0,0],2,3"
    weight_docs += "<br />Example 2 (DEFAULT): [0,0,0,0,0]"

    species = models.ForeignKey(Species)
    # defaults to first photographer defined. (Merrill A Peterson)
    photographer = models.ForeignKey(Photographer, default=1, help_text=photographer_docs)

    # Image field manages the creation and deletion of thumbnails
    # automatically. When an instance of this class is deleted, thumbnails
    # created for this field are automatically deleted too.
    image = ImageField(storage=OverwriteStorage(), upload_to=IMAGE_PATH)
    
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

    def zoomify_folder(self):
        # returns the name of the zoomify folder if it exists (trys with spaces in filename and with spaces replaced by underscores)
        # otherwise it returns "404" which is interpreted by slideshow/script.js
        z_folder = self.image.path.replace("/" + self.IMAGE_PATH, "/" + self.ZOOM_PATH)
        z_folder = z_folder[:z_folder.rfind(".")]

        # replace filename underscores with spaces (happens when uploaded via django-admin)
        z_folder_alt = z_folder[:z_folder.rfind("/")] + z_folder[z_folder.rfind("/"):].replace("_", " ")
        # replace first space with a - due to inconsistent naming conventions.
        z_folder_alt2 = z_folder[:z_folder.rfind("/")] + z_folder[z_folder.rfind("/"):].replace("-", " ", 1)

        if os.path.isdir(z_folder):
            return z_folder[z_folder.rfind(self.ZOOM_PATH):]
        elif os.path.isdir(z_folder_alt):
            return z_folder_alt[z_folder_alt.rfind(self.ZOOM_PATH):]
        elif os.path.isdir(z_folder_alt2):
            return z_folder_alt2[z_folder_alt2.rfind(self.ZOOM_PATH):]
        else:
            return "404"

    def license_details(self):
        r = self.record
        reared_terms = self.REARED_TERMS
        # reared terms are used to determine whether the date is suspect
        # if they are, we include our notes field
        notes = r.notes
        if notes:
            notes = notes.lower()
            for term in reared_terms:
                if term.lower() in notes:
                    notes = r.notes
                    break
            else:
                notes = ""

        s = ""

        if r.date:
            s += str(r.date.strftime("%B %d, %Y"))

        if r.collector:
            if r.date:
                s += ", "
            s += str(r.collector) + "."

        if notes:
            s += "<br />" + str(notes)
        if r.type_status:
            s += "<br />" + str(r.type_status)

        if r.collection and r.collection.url:
            s += '<br />Specimen courtesy of <a href="%s" target="_blank">%s</a>' % (r.collection.url, r.collection)
        elif r.collection:
            s += "<br />Specimen courtesy of %s" % r.collection
        s += "<br />Photograph copyright: %s" % self.photographer

        return s

class ExtendedPage(models.Model):
    page = models.ForeignKey(Page, unique=True, verbose_name=_("Page"), editable=False, related_name="extended_fields")
    navigation_images = models.ManyToManyField(SpeciesImage)


"""
SIGNAL HANDLING
"""
def add_plugin(placeholder, plugin_type, language, position='last-child', **data):
    """
    Taken from django-cms api (in newer versions)
    https://github.com/divio/django-cms/blob/b8633b42efcd137d96e1e3f42e004cb7595768fe/cms/api.py
    """
    assert isinstance(placeholder, Placeholder)
    plugin_model = plugin_type.model
    plugin_type = plugin_type.__name__
    plugin_base = CMSPlugin(
        plugin_type=plugin_type,
        placeholder=placeholder, 
        position=1,
        language=language
    )
    plugin_base.insert_at(None, position='last-child', commit=False)
    plugin = plugin_model(**data)
    plugin_base.set_base_attr(plugin)
    plugin.save()
    return plugin

def add_text_plugin(sender, **kwargs):
    instance = kwargs["instance"]
    if len(instance.description.get_plugins()) is 0:
        add_plugin(instance.description, plugin_pool.get_plugin("TextPlugin"), "en", body="<p>Default Text</p>")

post_save.connect(add_text_plugin, sender=PlateImage)
