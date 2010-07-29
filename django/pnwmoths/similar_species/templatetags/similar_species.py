"""
CouchDB template tag based on Django's built-in "url" template tag.
"""
from couchdbkit import Server
from django import template
from django.conf import settings
from django.template import Node, TemplateSyntaxError

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
    return sorted([row["value"] for row in view])


class SimilarSpeciesNode(Node):
    def __init__(self, species):
        self.species = species

    def render(self, context):
        # Get similar species images.
        return get_content(
            "pnwmoths/_design/moths/_list/full_images/by_species_image",
            group="true",
            image_url="http://pnwmoths.biol.wwu.edu/services/getFile.php",
            show_title="true",
            keys=get_similar_species(self.species.resolve(context))
        )


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
