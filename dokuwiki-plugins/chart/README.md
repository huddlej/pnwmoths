# DokuWiki Chart Plugin

The chart plugin allows users to insert a [jqPlot](http://www.jqplot.com) into a
wiki page using a data set predefined with the data plugin.

## How It Works

The chart plugin relies on two external applications: the DokuWiki data plugin
and the jqPlot jQuery plugin. The data plugin makes different data sets
available to any javascript applications through a global namespace. Each data
set is named and accessible by its unique name.

The chart plugin listens to the data source specified by the user. When the data
becomes available, the chart plugin sends it to jqPlot. The user may also
optionally specify jqPlot options that override the default options.

## Arguments

*Emphasized arguments* are required.

<dl>
    <dt><em>id</em></dt>
    <dd>(String) Unique name to identify this chart. This value will be used as the DOM id for the chart.</dd>
    <dt><em>data_source</em></dt>
    <dd>(String) Name of the predefined data source to use for chart data.</dd>
    <dt>options</dt>
    <dd>(<a href="http://www.json.org">JSON</a> Object) Options for jqPlot. This options object will be merged with the default jqPlot options object.</dd>
</dl>

## Examples

Simplest chart:

    <data>{"_name": "species-data", "_render": true, "method": "getSamples", "species": "Autographa ampla"}</data>
    <chart>{"id": "plot", "data_source": "species-data"}</chart>

Chart overriding default jqPlot options:

    <data>{"_name": "species-data", "_render": true, "method": "getSamples", "species": "Autographa ampla"}</data>
    <chart>
    {
        "id": "someotherplot",
        "data_source": "records",
        "options": {
            "title": "Flight Seasons?",
            "axes": {
                "xaxis": {
                    "label": "Some Axis Label"
                }
            }
        }
    }
    </chart>