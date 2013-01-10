from django.core.management.base import NoArgsCommand, CommandError
from cms.plugins.text.models import Text
from reversion import revision
import re

class Command(NoArgsCommand):
    def handle_noargs(self, **options):
        """
        Removes inline styles from wymeditor text to make it simpler
        to fix the bug in wym that adds a checkered background to content.
        """
        text_objs = Text.objects.all()
        count = 0
        print "<table>"
        for obj in text_objs:
            # Removes inline styles
            tbody = re.sub(' style=("|\')(.*?)("|\')', "", obj.body)
            if (len(tbody) < len(obj.body)):
                print "<td colspan='2'><h1>------------</h1></td>"
                print "<tr><td>"
                print obj.body.encode('ascii', 'ignore')
                print "</td><td>"
                print tbody.encode('ascii', 'ignore')
                print "</td></tr>"
                count += 1
        print "</table>"
        print count
