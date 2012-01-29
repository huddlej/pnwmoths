from django.template import Library, Node, TemplateSyntaxError
from django.template import Variable
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
import re

from pnwmoths.species.models import Species
from pnwmoths.species.resources import get_resource_by_url
from cms.models.pagemodel import Page

import random

register = Library()

# Regex for token keyword arguments
kwarg_re = re.compile(r"(?:(\w+)=)?(.+)")


class SpeciesByNameNode(Node):
    """
    Get the species instance for the given name and add it to the context.
    """
    def __init__(self, species_name, context_var):
        self.obj = Variable(species_name)
        self.context_var = context_var

    def render(self, context):
        # Create the template var by adding to context.
        try:
            genus, species = self.obj.resolve(context).split(" ", 1)
            instance = Species.objects.get(
                genus=genus,
                species=species
            )
        except (ValueError, Species.DoesNotExist):
            instance = None

        context[self.context_var] = instance

        return ""


def species_by_name(parser, token):
    """
    Retrieves a species instance for a given complete species name (genus and
    species).

    {% species_by_name species_name as species %}
    """
    try:
        bits = token.split_contents()
    except ValueError:
        raise TemplateSyntaxError(
            _('tag requires exactly three arguments')
        )

    if len(bits) != 4:
        raise TemplateSyntaxError(
            _('tag requires exactly three arguments')
        )

    if bits[2] != 'as':
        raise TemplateSyntaxError(
            _("second argument to tag must be 'as'")
        )

    return SpeciesByNameNode(bits[1], bits[3])

class ImagesetByNavNode(Node):
    """
    Get the species instance for the given name and add it to the context.
    """
    def __init__(self, navnode, leaf_count, context_var):
        self.obj = Variable(navnode)
        self.leaf_count = int(leaf_count)
        self.context_var = context_var

    def render(self, context):
        # Create the template var by adding to context.
        try:
            navnode = self.obj.resolve(context)
            page = Page.objects.get(pk=navnode.id)
            leaves = [x for x in page.get_descendants(include_self=True) if x.is_leaf_node()]
            imageset = []
            while len(imageset) < self.leaf_count and len(leaves) > 0:
                p = random.choice(leaves)
                leaves.remove(p)
                genus, species = p.get_title().split(" ", 1)
                im = Species.objects.get(genus=genus, species=species).get_first_image()
                imageset.append(im)

        except (Exception):
            imageset = None

        context[self.context_var] = imageset

        return ""


def imageset_by_navnode(parser, token):
    """
    Retrieves a random set of n images, 1 from each n species beneath this level
    in the tree. If navnode is a leaf, tries to return images from this species.
    If their are less than 4 species leaf nodes, however
    many species are found get 1 image put in.

    {% imageset_by_navnode navnode as 4 species %}
    """
    try:
        navnode, _, leaf_count, context_var = token.split_contents()[1:]
    except ValueError:
        raise TemplateSyntaxError(
            _('tag requires exactly 4 arguments')
        )

    return ImagesetByNavNode(navnode, leaf_count, context_var)

class ResourceNode(Node):
    def __init__(self, url, kwargs):
        self.url = url
        self.kwargs = kwargs

    def render(self, context):
        kwargs = dict([(smart_str(k, "ascii"), v.resolve(context))
                       for k, v in self.kwargs.items()])
        return get_resource_by_url(self.url, kwargs)


def resource(parser, token):
    """
    Returns the content associated with a Django URL and optional parameters.

    The first argument is a Django URL relative to the server. Keyword arguments
    are specified after the URL.

    For example, use the following code to embed the content of a Django view in
    a template:

        {% resource /poll/1/results/ limit=10 %}
    """
    bits = token.split_contents()
    if len(bits) < 2:
        raise TemplateSyntaxError("'%s' takes at least one argument"
                                  " (URL relative to Django HTTP server)" % bits[0])
    url = bits[1]
    kwargs = {}
    bits = bits[2:]

    # Now all the bits are parsed into new format,
    # process them as template vars
    if len(bits):
        for bit in bits:
            match = kwarg_re.match(bit)
            if not match:
                raise TemplateSyntaxError("Malformed arguments to resource tag")
            name, value = match.groups()
            if name:
                kwargs[name] = parser.compile_filter(value)

    return ResourceNode(url, kwargs)


register.tag("species_by_name", species_by_name)
register.tag("imageset_by_navnode", imageset_by_navnode)
register.tag("resource", resource)
