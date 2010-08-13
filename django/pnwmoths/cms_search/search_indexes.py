from haystack import indexes, site
from cms.models import Page


class PageIndex(indexes.SearchIndex):
    text = indexes.CharField(document=True, use_template=True)

site.register(Page, PageIndex)
