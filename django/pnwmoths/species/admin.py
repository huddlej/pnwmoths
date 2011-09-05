from django.contrib import admin
from sorl.thumbnail.admin import AdminImageMixin

from models import (Collection, Collector, County, Species, SpeciesImage,
                    SpeciesRecord, State)


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
admin.site.register(SpeciesRecord, SpeciesRecordAdmin)


admin.site.register(Collection)
admin.site.register(Collector)
admin.site.register(County)
admin.site.register(Species)
admin.site.register(State)
