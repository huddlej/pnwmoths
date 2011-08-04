from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext

from forms import ImportSpeciesRecordsForm
from models import SpeciesRecord


@login_required
def import_species_records(request):
    opts = SpeciesRecord._meta
    context = {"opts": opts,
               "app_label": opts.app_label,
               "add": True,
               "title": "Import Species Records"}

    form = ImportSpeciesRecordsForm(request.POST or None, request.FILES or None)
    context.update({"form": form})

    return render_to_response("admin/import.html",
                              context,
                              context_instance=RequestContext(request))
