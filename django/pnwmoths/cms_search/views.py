from haystack.views import SearchView
from django.shortcuts import redirect

class FancyRedirectSearchView(SearchView): 
    def __name__(self): 
        return "FancyRedirectSearchView" 
    def create_response(self): 
        results = super(FancyRedirectSearchView, self).get_results()
        if len(results) == 1:
            return redirect(results[0].object)
        else:
            return super(FancyRedirectSearchView, self).create_response()
