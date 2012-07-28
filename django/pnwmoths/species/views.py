from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext

from forms import ImportSpeciesRecordsForm
from models import Species, SpeciesRecord, PlateImage


IMPORT_ERROR_MESSAGE = """There was a problem with one or more rows in your
data. Please correct these rows and try uploading again."""


@login_required
def import_species_records(request):
    opts = SpeciesRecord._meta
    context = {"opts": opts,
               "app_label": opts.app_label,
               "add": True,
               "title": "Import Species Records"}

    form = ImportSpeciesRecordsForm(request.POST or None, request.FILES or None)
    if form.is_valid():
        results, errors = form.import_data(
            form.cleaned_data["model"],
            request.FILES["file"],
            form.cleaned_data["delimiter"],
            overwrite=form.cleaned_data["overwrite"]
        )
        context.update({"errors": errors, "results": results})

        if len(errors) > 0:
            messages.error(request, IMPORT_ERROR_MESSAGE)
        else:
            messages.success(request, "Your data was imported successfully.")
            return HttpResponseRedirect(reverse("speciesrecord_import"))

    context.update({"form": form})

    return render_to_response("admin/import.html",
                              context,
                              context_instance=RequestContext(request))


def transform_species_record(request, data):
    """
    Transforms a CSV record into a species record.
    """
    species, created = Species.objects.get_or_create(
        genus=data["genus"],
        species=data["species"]
    )

    new_data = {
        "species": species,
        "latitude": data.get("latitude") or 0,
        "longitude": data.get("longitude") or 0
    }

    return new_data

def photographic_plate_zoomify(request, plate_pk):
    """
    Renders a zoomified version of the photographic plate if it exists.
    Meant to be viewed in a popup window.
    """
    plate = get_object_or_404(PlateImage, pk=plate_pk)

    prev_id = PlateImage.objects.all().filter(pk__lt=plate_pk).order_by('-pk')[0:1]
    if len(prev_id) > 0:
        prev_id = prev_id[0].pk
    else:
      prev_id = None
    next_id = PlateImage.objects.all().filter(pk__gt=plate_pk).order_by('pk')[0:1]
    if len(next_id) > 0:
        next_id = next_id[0].pk
    else:
        next_id = None

    z_path = None
    if plate.z_image:
        z_path = plate.z_image[plate.z_image.index("media/"):plate.z_image.rindex("/")]
    return render_to_response("zoomify_plate.html",
                                {"plate": plate, "z_path": z_path, "next_pk": next_id, "prev_pk": prev_id},
                                context_instance=RequestContext(request))
