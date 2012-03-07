from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from sorl.thumbnail.admin import AdminImageMixin
from tastypie.admin import ApiKeyInline
from tastypie.models import ApiAccess, ApiKey

from actions import export_records_as_csv_action, export_labels_as_csv_action
from models import (Collection, Collector, County, Species, SpeciesImage,
                    SpeciesRecord, State, Author)


admin.site.register(ApiKey)
admin.site.register(ApiAccess)

class UserModelAdmin(UserAdmin):
        inlines = [ApiKeyInline]

admin.site.unregister(User)
admin.site.register(User, UserModelAdmin)


class CountyAdmin(admin.ModelAdmin):
    list_display = ("name", "state")
    list_filter = ("state",)
admin.site.register(County, CountyAdmin)

class AuthorAdmin(admin.ModelAdmin):
    list_display = ("authority",)
    search_fields = ("authority",)
admin.site.register(Author, AuthorAdmin)

class SpeciesAdmin(admin.ModelAdmin):
    filter_horizontal = ("similar",)
    list_display = ("__unicode__", "noc_id", "factsheet", "common_name")
    list_editable = ("common_name",)
    search_fields = ("genus", "species")
admin.site.register(Species, SpeciesAdmin)


class SpeciesImageAdmin(AdminImageMixin, admin.ModelAdmin):
    readonly_fields = ("record",)

    # callable required to include foreign key in list_display
    def noc_id(self):
        return self.species.noc_id
    noc_id.admin_order_field  = 'species__noc_id'

    list_display = (
        noc_id,
        "species",
        "image",
        "weight"
    )
    list_editable = ("weight",)
    search_fields = ("species__genus", "species__species", "image")
admin.site.register(SpeciesImage, SpeciesImageAdmin)


class SpeciesRecordAdmin(admin.ModelAdmin):
    class Media:
        js = ("/media/custom_admin/filter.js", "/media/custom_admin/speciesrecords.js", )
    
    # callable required to include foreign key in list_display
    def noc_id(self):
        return self.species.noc_id
    noc_id.admin_order_field  = 'species__noc_id'

    def rec_type(self):
        if self.speciesimage_set.exists():
            return "Label"
        else:
            return "Record"

    list_display = (
        rec_type,
        noc_id,
        "species",
        "latitude",
        "longitude",
        "locality",
        "county",
        "state",
        "collection",
        "collector",
        "day",
        "month",
        "year",
        "notes",
    )
    list_filter = (
        "state",
        "county",
        "collection",
        "year",
        "collector",
        "locality",
    )
    list_select_related = True
    search_fields = ("species__genus", "species__species", "year", "collector", "locality", "notes", "latitude", "longitude")
    actions = [export_labels_as_csv_action(), export_records_as_csv_action()]
    
    # The admin section's record/label filter performs a table join that returns
    # duplicate records that display in the admin interface. This override
    # guarentees distinct results.
    def queryset(self, request):
        return super(SpeciesRecordAdmin,self).queryset(request).distinct()

admin.site.register(SpeciesRecord, SpeciesRecordAdmin)


admin.site.register(Collection)
admin.site.register(Collector)
admin.site.register(State)
