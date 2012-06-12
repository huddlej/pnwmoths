import csv
from django.http import HttpResponse
from os.path import basename, splitext
from pnwmoths.species.forms import SpeciesRecordForm

"""
    csv export
    based on http://djangosnippets.org/snippets/1697/
"""
def export_labels_as_csv_action(description="Export Labels as CSV"):
    def export_labels_as_csv(modeladmin, request, queryset):
        opts = modeladmin.model._meta
        field_names = set([field.name for field in opts.fields])
        field_names = field_names - set(["csv_file"])
        field_names = list(field_names)

        response = HttpResponse(mimetype='text/csv')
        response['Content-Disposition'] = 'attachment; filename=%s.csv' % unicode(opts).replace('.', '_')
        writer = csv.writer(response)
        
        # order columns according to model, Print filename column
        field_names = [x for x in SpeciesRecordForm.base_fields.keys() if x in set(field_names)]
        field_names.insert(0, "filename")
        writer.writerow(field_names)
        field_names.pop(0)

        # removes non-labels from the queryset
        queryset = queryset.filter(speciesimage__isnull=False)

        for obj in queryset:
            # for each label's image:
            already_added = set()
            for im in obj.speciesimage_set.all():
                d = [unicode(getattr(obj, field, "")
                                         if getattr(obj, field) is not None
                                         else "").encode("utf-8","replace")
                                 for field in field_names]
                # adds filename value                
                # basename grabs the filename, splitext seperates the extension
                # [:-1] pulls off the V/D distinction and then adds label
                # We then export one row for each id, with multiple image pairs
                # in the format Genus species-A-label
                merged = splitext(basename(im.image.name))[0][:-1] + "label"
                if merged not in already_added:
                    already_added.add(merged)
                    d.insert(0, merged)
                    writer.writerow(d)

        return response

    export_labels_as_csv.short_description = description
    return export_labels_as_csv

def export_records_as_csv_action(description="Export Records as CSV"):
    def export_records_as_csv(modeladmin, request, queryset):
        opts = modeladmin.model._meta
        field_names = set([field.name for field in opts.fields])
        field_names = field_names - set(["csv_file"])
        field_names = list(field_names)

        # order columns according to model
        field_names = [x for x in SpeciesRecordForm.base_fields.keys() if x in set(field_names)]

        response = HttpResponse(mimetype='text/csv')
        response['Content-Disposition'] = 'attachment; filename=%s.csv' % unicode(opts).replace('.', '_')
        writer = csv.writer(response)
        writer.writerow(field_names)

        # removes non-records from the queryset
        queryset = queryset.filter(speciesimage__isnull=True)

        for obj in queryset:
            writer.writerow([unicode(getattr(obj, field, "")
                                     if getattr(obj, field) is not None
                                     else "").encode("utf-8","replace")
                             for field in field_names])

        return response

    export_records_as_csv.short_description = description
    return export_records_as_csv
