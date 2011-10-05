from django.contrib import admin
from sorl.thumbnail.admin import AdminImageMixin

from actions import export_as_csv_action
from models import (Collection, Collector, County, Species, SpeciesImage,
                    SpeciesRecord, State)


class SpeciesAdmin(admin.ModelAdmin):
    filter_horizontal = ("similar",)
    list_display = ("__unicode__", "common_name")
    list_editable = ("common_name",)
    search_fields = ("genus", "species")
admin.site.register(Species, SpeciesAdmin)


class SpeciesImageAdmin(AdminImageMixin, admin.ModelAdmin):
    pass
admin.site.register(SpeciesImage, SpeciesImageAdmin)


class SpeciesRecordAdmin(admin.ModelAdmin):
    list_display = (
        "species",
        "latitude",
        "longitude",
        "state",
        "county",
        "collection",
        "collector"
    )
    list_filter = (
        "state",
        "county",
        "collection"
    )
    search_fields = ("species__genus", "species__species")
    actions = [export_as_csv_action("CSV export")]
admin.site.register(SpeciesRecord, SpeciesRecordAdmin)


admin.site.register(Collection)
admin.site.register(Collector)
admin.site.register(County)
admin.site.register(State)
