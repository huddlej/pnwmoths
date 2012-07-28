from django import template
from django.db.models import F
from cms.models.pagemodel import Page
from cms.menu import NavigationNode
from cms.models import Title
register = template.Library()

@register.filter
def navnode_is_species_or_genus(value):
    """
        Returns True if a navigation node is a genus
        or species, otherwise False.
        Created for use in templates/menu/browse_submenu.html
    """
    if isinstance(value, NavigationNode):
        p = Page.objects.get(pk=value.id)
        
        if p.is_leaf_node():
            return True
        
        return not p.get_children().exclude(lft=F('rght')-1).count()
    else:
        return False

@register.filter
def navnode_species_count(value):
    """
        Returns the leaf count of a NavigationNode in (%d) format if
        greater than 0, otherwise it returns "".
        Will attempt to coerce by finding a navigationnode
        with the same title as the value passed in.
        Created for use in templates/menu/browse_submenu.html
    """
    page = None

    if isinstance(value, NavigationNode):
        try:
            page = Page.objects.get(pk=value.id)
        except (Exception):
            return ""
    else:
        try:
            page = Title.objects.get(title=value).page
        except (Exception):
            return ""

    try:
        lf_ct = page.get_descendants().filter(lft=F('rght')-1).count()
        if lf_ct:
            return "%d" % lf_ct
        else:
            return ""
    except (Exception):
        return ""
