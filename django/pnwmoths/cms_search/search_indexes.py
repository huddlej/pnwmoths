from cms.models import Page
import datetime
from django.db.models import Q
from haystack import indexes, site


class PageIndex(indexes.SearchIndex):
    text = indexes.CharField(document=True, use_template=True)

    def get_queryset(self):
        """
        Limits search results to pages that have been published and either don't
        have start and end dates or the current time is between the start and
        end dates.
        """
        queryset = Page.objects.filter(published=True)
        not_expired = Q(publication_end_date__gt=datetime.datetime.now()) | Q(publication_end_date__isnull=True)
        already_published = Q(publication_date__lte=datetime.datetime.now()) | Q(publication_date__isnull=True)
        queryset = queryset.filter(not_expired).filter(already_published)
        return queryset

site.register(Page, PageIndex)
