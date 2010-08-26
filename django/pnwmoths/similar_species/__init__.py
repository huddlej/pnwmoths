from cushion.forms import form_registry, view_form_registry
from forms import BatchSimilarForm, SimilarForm


# Register forms with cushion.
form_registry.register("SimilarForm", SimilarForm)
view_form_registry.register("moths/by_similar_species", BatchSimilarForm)
