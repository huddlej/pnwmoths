# Installing PNW Moths

All data for the PNW Moths project is stored in version control. All project
code is stored in the [pnwmoths](http://github.com/huddlej/pnwmoths/) repository
and all project content is stored in
[pnwmoths-www](http://github.com/huddlej/pnwmoths-www/) repository.

To get the latest code and content, checkout both repositories:

    git clone http://github.com/huddlej/pnwmoths.git /usr/src/pnwmoths
    git clone http://github.com/huddlej/pnwmoths-www.git /usr/src/pnwmoths-www

## DokuWiki

All custom DokuWiki code is stored in "pnwmoths/dokuwiki".

### Configuration

 1. Enter the DokuWiki admin site.
 1. Select "Configuration Settings".
 1. Find the "Editing Settings" section.
 1. Check the "Allow embedded HTML" option.
 1. Find the "Display Settings" section.
 1. Select "Always" for the "Use first heading for pagenames" option.

### Template

 1. Copy the DokuWiki template files from the pnwmoths directory to the DokuWiki template directory:

     <pre><code>cp -R /usr/src/pnwmoths/dokuwiki/lib/tpl/pnwmoths /usr/local/www/dokuwiki/lib/tpl/pnwmoths</code></pre>
 1. Enter the DokuWiki admin site.
 1. Select "Configuration Settings".
 1. Find the "Template" setting under "Basic Settings" and select "pnwmoths".
 1. Save settings.

### Third-party Plugins

Follow the [DokuWiki plugin installation
instructions](http://www.dokuwiki.org/plugin_installation_instructions) for
third-party plugins.

The following third-party plugins need to be installed:

 * [Templater](http://www.dokuwiki.org/plugin:templater)

### Custom Plugins

All custom plugins for the PNW Moths project can be installed by symbolic
linking as follows (substituting each plugin name for "<plugin>"):

    ln -s /usr/src/pnwmoths/dokuwiki/lib/plugins/<plugin> /usr/local/www/dokuwiki/lib/plugins/<plugin>

## Google Maps

Each domain that uses the Google Maps API needs its own API key. If the domain
changes for the PNW Moths project, take the following steps:

 1. [Generate a new API key](http://code.google.com/apis/maps/signup.html) for the new domain.
 1. Copy the new API key.
 1. In Dokuwiki, navigate to the "Configuration Settings" in the admin site.
 1. Find the "Google Maps API Key" setting under "Plugin Settings".
 1. Paste the new API key into the "Google Maps API Key" setting field.
 1. Save settings.

## Tillikum CouchDb

Checkout the Tillikum CouchDb library to /usr/src/tillikum-couchdb:

    git clone http://github.com/strattg/tillikum-couchdb.git /usr/src/tillikum-couchdb
