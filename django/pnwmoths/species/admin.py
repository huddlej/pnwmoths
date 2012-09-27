from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from reversion.admin import VersionAdmin
from sorl.thumbnail.admin import AdminImageMixin
from sorl.thumbnail import get_thumbnail
from ajax_select import make_ajax_form
from ajax_select.admin import AjaxSelectAdmin
from django.core import urlresolvers
from cms.admin.placeholderadmin import PlaceholderAdmin
from cms.admin.pageadmin import PageAdmin
from cms.models.pagemodel import Page

from actions import export_records_as_csv_action, export_labels_as_csv_action
from models import (Collection, Collector, County, Species, SpeciesImage, ExtendedPage,
                    SpeciesRecord, State, Author, PlateImage, Photographer, GlossaryWord, GlossaryImage)
from forms import PlateImageAdminForm

class UserModelAdmin(UserAdmin):
  pass

admin.site.unregister(User)
admin.site.register(User, UserModelAdmin)

class ExtendedPageAdmin(admin.StackedInline):
    class Media:
        css = {'all': ('/media/custom_admin/wide_select.css',)}
    filter_horizontal = ("navigation_images",)
    model = ExtendedPage
    can_delete = False

PageAdmin.inlines.append(ExtendedPageAdmin)
try:
    admin.site.unregister(Page)
except:
    pass
admin.site.register(Page, PageAdmin)

class GlossaryWordAdmin(VersionAdmin, AdminImageMixin, admin.ModelAdmin):
    def thumb(self):
        t = self.image
        if t:
            pk = t.pk
            t = get_thumbnail(t.image,"70x46")
            return u'<a href="%s" target="_blank"><img src="%s" /></a>' % (urlresolvers.reverse('admin:species_glossaryimage_change', args=(pk,)), t.url)
        else:
            return u"None"
    thumb.short_description = 'Photo'
    thumb.allow_tags = True 

    list_display = ("word", thumb,)
    search_fields = ("word", "definition",)
admin.site.register(GlossaryWord, GlossaryWordAdmin)

class CountyAdmin(VersionAdmin, admin.ModelAdmin):
    list_display = ("name", "state")
    list_filter = ("state",)
admin.site.register(County, CountyAdmin)

class AuthorAdmin(VersionAdmin, admin.ModelAdmin):
    list_display = ("authority",)
    search_fields = ("authority",)
admin.site.register(Author, AuthorAdmin)

class SpeciesAdmin(VersionAdmin, admin.ModelAdmin):
    filter_horizontal = ("similar",)
    list_display = ("__unicode__", "noc_id", "factsheet", "authority", "common_name")
    list_editable = ("common_name",)
    search_fields = ("genus", "species")
admin.site.register(Species, SpeciesAdmin)


class SpeciesImageAdmin(VersionAdmin, AjaxSelectAdmin, AdminImageMixin, admin.ModelAdmin):
    class Media:
        css = {'all': ("/media/custom_admin/ajax_select.css",)}
    ordering = ["species", "weight", "image"]
    # callable required to include foreign key in list_display
    def noc_id(self):
        return self.species.noc_id
    noc_id.admin_order_field  = 'species__noc_id'

    def collection(self):
        return self.record.collection
    collection.admin_order_field = 'record__collection'

    list_display = (
        noc_id,
        "species",
        "image",
        collection,
        "photographer",
        "weight"
    )
    list_editable = ("weight",)
    search_fields = ("species__genus", "species__species", "image")
    form = make_ajax_form(SpeciesImage,{'record':'SpeciesRecord'})
    
admin.site.register(SpeciesImage, SpeciesImageAdmin)


class SpeciesRecordAdmin(VersionAdmin, AdminImageMixin, admin.ModelAdmin):
    class Media:
        js = ("/media/custom_admin/filter.js", "/media/custom_admin/speciesrecords.js", )
    
    # callable required to include foreign key in list_display
    def noc_id(self):
        return self.species.noc_id
    noc_id.admin_order_field  = 'species__noc_id'
    
    def thumb(self):
        t = self.speciesimage_set.all()[:1].get()
        if t:
            pk = t.pk
            t = get_thumbnail(t.image,"70x46")
            return u'<a href="%s" target="_blank"><img src="%s" /></a>' % (urlresolvers.reverse('admin:species_speciesimage_change', args=(pk,)), t.url)
        else:
            return u"None"
    thumb.admin_order_field = 'speciesimage'
    thumb.short_description = 'Photo'
    thumb.allow_tags = True 

    def get_readonly_fields(self, request, obj=None):
        """
        Dynamic readonly list so that new objects can get their csv_file changed.
        """
        if obj:
            return ['csv_file']
        else:
            return []

    def rec_type(self):
        if self.speciesimage_set.exists():
            return "Label"
        else:
            return "Record"

    list_display = (
        "record_type",
        thumb,
        noc_id,
        "species",
        "latitude",
        "longitude",
        "locality",
        "county",
        "state",
        "elevation",
        "collection",
        "collector",
        "day",
        "month",
        "year",
        "males",
        "females",
        "notes",
        "date_added"
    )

    list_filter = (
        "record_type",
        "state",
        "county",
        "collection",
        "year",
        "collector",
        "locality",
        "csv_file",
        "date_added",
    )
    list_select_related = True
    search_fields = ("species__genus", "species__species", "year", "collector__name", "collection__name", "locality", "notes", "latitude", "longitude")
    actions = [export_labels_as_csv_action(), export_records_as_csv_action()]
    
    # The admin section's record/label filter performs a table join that returns
    # duplicate records that display in the admin interface. This override
    # guarentees distinct results.
    def queryset(self, request):
        return super(SpeciesRecordAdmin,self).queryset(request).distinct()

admin.site.register(SpeciesRecord, SpeciesRecordAdmin)

class PlateImageAdmin(VersionAdmin, PlaceholderAdmin):
    form = PlateImageAdminForm

admin.site.register(PlateImage, PlateImageAdmin)

class PhotographerAdmin(VersionAdmin, admin.ModelAdmin):
    pass
admin.site.register(Photographer, PhotographerAdmin)

class CollectionAdmin(VersionAdmin, admin.ModelAdmin):
    list_display = ("name", "url",)
    list_editable = ("url",)
    search_fields = ("name", "url",)

admin.site.register(Collection, CollectionAdmin)

class CollectorAdmin(VersionAdmin, admin.ModelAdmin):
    pass
admin.site.register(Collector, CollectorAdmin)

class StateAdmin(VersionAdmin, admin.ModelAdmin):
    pass
admin.site.register(State, StateAdmin)

class GlossaryImageAdmin(VersionAdmin, AdminImageMixin, admin.ModelAdmin):
    pass
admin.site.register(GlossaryImage, GlossaryImageAdmin)
