"""
Middleware for the pnwmoths project.
"""
from tastypie.models import ApiKey
from django.http import HttpResponseRedirect
from django.conf import settings
from re import compile


# Login required middleware from Ryan Witt's blog post:
# http://onecreativeblog.com/post/59051248/django-login-required-middleware
EXEMPT_URLS = [compile(settings.LOGIN_URL.lstrip('/'))]
if hasattr(settings, 'LOGIN_EXEMPT_URLS'):
    EXEMPT_URLS += [compile(expr) for expr in settings.LOGIN_EXEMPT_URLS]


class LoginRequiredMiddleware:
    """
    Middleware that requires a user to be authenticated to view any page other
    than LOGIN_URL. Exemptions to this requirement can optionally be specified
    in settings via a list of regular expressions in LOGIN_EXEMPT_URLS (which
    you can copy from your urls.py).

    Requires authentication middleware and template context processors to be
    loaded. You'll get an error if they aren't.
    """
    def process_request(self, request):
        assert hasattr(request, 'user'), "The Login Required middleware\
 requires authentication middleware to be installed. Edit your\
 MIDDLEWARE_CLASSES setting to insert\
 'django.contrib.auth.middlware.AuthenticationMiddleware'. If that doesn't\
 work, ensure your TEMPLATE_CONTEXT_PROCESSORS setting includes\
 'django.core.context_processors.auth'."
        if not request.user.is_authenticated():
            # Try to verify API key for user if username and API key are
            # given. Allowed unauthenticated users to access data with a
            # username and API key.
            if request.GET.get("username") and request.GET.get("api_key"):
                try:
                    ApiKey.objects.get(
                        user__username=request.GET.get("username"),
                        key=request.GET.get("api_key")
                    )
                    return None
                except ApiKey.DoesNotExist:
                    pass

            path = request.path_info.lstrip('/')
            if not any(m.match(path) for m in EXEMPT_URLS):
                return HttpResponseRedirect(settings.LOGIN_URL)
