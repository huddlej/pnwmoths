from django.contrib import admin
from sorl.thumbnail.admin import AdminImageMixin

from models import (Collection, Collector, County, Species, SpeciesImage,
                    SpeciesRecord, State)


class SpeciesImageAdmin(AdminImageMixin, admin.ModelAdmin):
    pass
admin.site.register(SpeciesImage, SpeciesImageAdmin)


admin.site.register(Collection)
admin.site.register(Collector)
admin.site.register(County)
admin.site.register(Species)
admin.site.register(SpeciesRecord)
admin.site.register(State)
