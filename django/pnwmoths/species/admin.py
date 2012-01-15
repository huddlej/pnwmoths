from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from sorl.thumbnail.admin import AdminImageMixin
from tastypie.admin import ApiKeyInline
from tastypie.models import ApiAccess, ApiKey

from actions import export_as_csv_action
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
    list_display = ("__unicode__", "common_name")
    list_editable = ("common_name",)
    search_fields = ("genus", "species")
admin.site.register(Species, SpeciesAdmin)


class SpeciesImageAdmin(AdminImageMixin, admin.ModelAdmin):
    readonly_fields = ("record",)
    list_display = (
        "species",
        "image",
        "weight"
    )
    list_editable = ("weight",)
    search_fields = ("species__genus","species__species", "image")
admin.site.register(SpeciesImage, SpeciesImageAdmin)


class SpeciesRecordAdmin(admin.ModelAdmin):
    list_display = (
        "species",
        "latitude",
        "longitude",
        "locality",
        "county",
        "state",
        "collection",
        "collector"
    )
    list_filter = (
        "state",
        "county",
        "collection"
    )
    list_select_related = True
    search_fields = ("species__genus", "species__species")
    actions = [export_as_csv_action("CSV export")]
admin.site.register(SpeciesRecord, SpeciesRecordAdmin)


admin.site.register(Collection)
admin.site.register(Collector)
admin.site.register(State)
