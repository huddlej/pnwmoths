from django.template import Library, Node, TemplateSyntaxError
from django.template import Variable
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
from django.db.models import F
import re

from pnwmoths.species.models import Species, PlateImage, GlossaryWord
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
    Adds an imageset for the current tree level's species.
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
            try:
                extended = page.extended_fields.get()
            except:
                extended = None
            if extended and extended.navigation_images.count() > 3:
                imageset = list(extended.navigation_images.all()[:4])
            else:
                leaves = list(page.get_descendants(include_self=True).filter(lft=F('rght')-1)[:6])
                imageset = []
                for p in leaves:
                    genus, species = p.get_title().split(" ", 1)
                    try:
                        im = Species.objects.get(genus=genus, species=species).get_first_image()
                    except (Exception):
                        im = None
                    if im:
                        imageset.append(im)
                    if len(imageset) == self.leaf_count:
                        break 
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


def load_glossary_words(parser, token):
    """
    Retrieves a list of Glossary Words.
    {% load_glossary_words as words %}
    """
    class GlossaryWords(Node):
        def __init__(self, context_var):
            self.context_var = context_var

        def render(self, context):
            try:
                context[self.context_var] = GlossaryWord.objects.all()
            except:
                pass

            return ""


    try:
        _, context_var = token.split_contents()[1:]
    except ValueError:
        raise TemplateSyntaxError(_('tag requires 2 arguments'))

    return GlossaryWords(context_var)


def load_plateimages(parser, token):
    """
    Retrieves a list of Plate Images.
    {% load_plateimages as plates %}
    """
    class PlateImages(Node):
        def __init__(self, context_var):
            self.context_var = context_var

        def render(self, context):
            try:
                # Try to set our context_var to our PlateImages
                context[self.context_var] = PlateImage.objects.all()
            except:
                pass

            return ""


    try:
        _, context_var = token.split_contents()[1:]
    except ValueError:
        raise TemplateSyntaxError(_('tag requires 2 arguments'))

    return PlateImages(context_var)

register.tag("species_by_name", species_by_name)
register.tag("imageset_by_navnode", imageset_by_navnode)
register.tag("load_plateimages", load_plateimages)
register.tag("load_glossary_words", load_glossary_words)
