from django import template
from django.db.models import F
from cms.models.pagemodel import Page
from cms.menu import NavigationNode
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
        greater than 0, otherwise empty string.
        Created for use in templates/menu/browse_submenu.html
    """
    if isinstance(value, NavigationNode):
        page = Page.objects.get(pk=value.id)
        lf_ct = page.get_descendants().filter(lft=F('rght')-1).count()
        if lf_ct:
            return "(%d)" % lf_ct
        else:
            return ""
    else:
        return ""
