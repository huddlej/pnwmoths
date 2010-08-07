"""
Template tag for displaying similar species information.
"""
from couchdbkit import Server
from django import template
from django.conf import settings

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


def similar_species(context):
    """
    Returns an HTML slideshow of images for similar species of the given
    species.
    """
    new_context = {}
    current_page = context.get("current_page")
    if current_page:
        species_name = current_page.get_title()
        new_context.update({"similar_species": get_similar_species(species_name),
                            "species_name": species_name,
                            "request": context.get("request")})
    return new_context
similar_species = register.inclusion_tag("similar_species/similar_species.html", takes_context=True)(similar_species)
