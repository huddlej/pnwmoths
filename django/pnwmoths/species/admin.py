from django.contrib import admin

from models import (Collection, Collector, County, Species, SpeciesImage,
                    SpeciesRecord, State)


admin.site.register(Collection)
admin.site.register(Collector)
admin.site.register(County)
admin.site.register(Species)
admin.site.register(SpeciesImage)
admin.site.register(SpeciesRecord)
admin.site.register(State)
