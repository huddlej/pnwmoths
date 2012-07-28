from ajax_select import LookupChannel
from django.utils.html import escape
from models import SpeciesRecord
from django.db.models import Q
from django.core import urlresolvers

class SpeciesRecordLookup(LookupChannel):
    model = SpeciesRecord

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        if q.isdigit():
            return SpeciesRecord.objects.filter(id__startswith=q)
        else:
            return SpeciesRecord.objects.filter(species__species__istartswith=q)
        
    def get_result(self,obj):
        u""" result is the simple text that is the completion of what the person typed """
        return str(obj)

    def format_match(self,obj):
        """ (HTML) formatted item for display in the dropdown """
        return u'<div>id: %s<br /><strong>%s</strong><br />%s</div>' % (str(obj.id), escape(obj), obj.details_tostr())

    def format_item_display(self,obj):
        """ (HTML) formatted item for displaying item in the selected deck area """
        edit_url = u'<a href="%s">%s</a>' % (urlresolvers.reverse('admin:species_speciesrecord_change', args=(obj.pk,)), escape(obj))
        return u'<div style="clear: both"><strong>%s</strong><br />%s</div>' % (edit_url, obj.details_tostr())
