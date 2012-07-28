from django.core.management.base import NoArgsCommand, CommandError
from cms.plugins.text.models import Text
from reversion import revision
import re

class Command(NoArgsCommand):

    @revision.create_on_success
    def handle_noargs(self, **options):
        """
        Removes inline styles from wymeditor text to make it simpler
        to fix the bug in wym that adds a checkered background to content.
        """
        text_objs = Text.objects.all()
        for obj in text_objs:
            # Removes inline styles
            obj.body = re.sub(' style=("|\')(.*?)("|\')', "", obj.body)
            obj.save()
