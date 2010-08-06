"""
Template tag for displaying similar species information.
"""
from couchdbkit import Server
from django import template
from django.conf import settings
from django.template import Context, Node, Template, TemplateSyntaxError
from django.template.loader import get_template

from pnwmoths.couchdb_templatetags.templatetags.couchdb import get_content

register = template.Library()


def get_similar_species(species):
    """
    Returns a list of strings representing the species similar to the given
    species.
    """
    server = Server(getattr(settings, "COUCHDB_SERVER", "http://localhost:5984"))
    db = server.get_or_create_db("pnwmoths")
    view = db.view(
        "moths/by_similar_species",
        reduce="false",
        key=species
    )
    similar_species = sorted([row["value"] for row in view])

    return list(db.view(
        "moths/by_species_image",
        group="true",
        keys=similar_species
    ))


class SimilarSpeciesNode(Node):
    def __init__(self, species):
        self.species = species

    def render(self, context):
        # Get similar species.
        similar_species = get_similar_species(self.species.resolve(context))

        # Render similar species template and return the result.
        template = get_template("similar_species/similar_species.html")
        context = Context({"similar_species": similar_species})
        return template.render(context)


def similar_species(parser, token):
    """
    Returns an HTML slideshow of images for similar species of the given
    species.
    """
    bits = token.split_contents()
    if len(bits) != 2:
        raise TemplateSyntaxError("'%s' takes exactly one argument"
                                  " (name of the species to find similar species for)" % bits[0])
    species = parser.compile_filter(bits[1])

    return SimilarSpeciesNode(species)
similar_species = register.tag(similar_species)
