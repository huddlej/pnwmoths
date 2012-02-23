from django import template
from cms.models.pagemodel import Page
from cms.menu import NavigationNode
register = template.Library()

@register.filter
def navnode_is_species_or_genus(value):
    """
        Returns True if a navigation node is a genus
        or species, otherwise False.
    """
    if isinstance(value, NavigationNode):
        p = Page.objects.get(pk=value.id)
        if p.is_leaf_node():
            # species
            return True
        else:
            for i in p.children.all():
                if not len(i.children.all()):
                    # genus
                    return True
            return False
    else:
        return False

@register.filter
def navnode_species_count(value):
    """
        Returns the leaf count in (%d) format if
        greater than 0, otherwise empty string.
    """
    if isinstance(value, NavigationNode):
        page = Page.objects.get(pk=value.id)
        leaves = [x for x in page.get_descendants() if x.is_leaf_node()]
        if len(leaves):
            return "(%d)" % len(leaves)
        else:
            return ""
    else:
        return ""