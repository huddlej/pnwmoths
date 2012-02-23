from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from django.utils.translation import ugettext_lazy as _

from models import FeaturedMothImage

class FeaturedMothImagePlugin(CMSPluginBase):
    """
       Django CMS plugin that can be inserted on any page.
       Configuration Options: A list of species to select from randomly.
       Sets fm, Species, and fm_img, Image, in the template's context.
       Created for use in templates/cms/home.html
    """
    model = FeaturedMothImage
    name = _("Featured Moth Image")
    render_template = "cms_plugin/featured_moth.html"

    def render(self, context, instance, placeholder):
        try: 
            # random record from plugin's settings
            r_m = instance.species.order_by('?')[0]
            context.update({'fm': r_m, 'fm_img':r_m.get_first_image()})
        except (IndexError):
            context['instance'] = instance

        return context

plugin_pool.register_plugin(FeaturedMothImagePlugin)
