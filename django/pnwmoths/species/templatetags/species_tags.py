from django.template import Library, Node, TemplateSyntaxError
from django.template import Variable
from django.utils.translation import ugettext as _
from django.contrib.contenttypes.models import ContentType

from pnwmoths.species.models import Species

register = Library()


class SpeciesByNameNode(Node):
    """
    Get the species instance for the given name and add it to the context.
    """
    def __init__(self, species_name, context_var):
        self.obj = Variable(species_name)
        self.context_var = context_var

    def render(self, context):
        # Create the template var by adding to context.
        genus, species = self.obj.resolve(context).split(" ", 1)
        context[self.context_var] = Species.objects.get(
            genus=genus,
            species=species
        )

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


register.tag("species_by_name", species_by_name)
