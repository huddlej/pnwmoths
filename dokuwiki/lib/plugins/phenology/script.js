jQuery(document).ready(function () {
    jQuery(document).bind(
        "dataIsReady",
        function (event) {
            var phenologyData = [],
                startInterval = 0,
                endInterval = 12,
                i,
                plot;

            // Pre-populate samples by interval with zeros.
            for (i = startInterval; i < endInterval; i++) {
                phenologyData[i] = 0;
            }

            // Map sample data to the given interval by counting each sample
            // that matches an interval marker.
            for (i in data) {
                if (data.hasOwnProperty(i) && data[i].month) {
                    phenologyData[parseInt(data[i].month) - 1] += 1;
                }
            }

            plotDiv = jQuery("#plot");
            plotDiv.show();
            plotDiv.empty();
            plot = new Phenology(species, phenologyData);
            plotDiv.hide();
        }
    );
});

function Phenology (species, data) {
    return jQuery.jqplot(
        "plot",
        [data],
        {
            seriesDefaults: {
                renderer: jQuery.jqplot.BarRenderer,
                rendererOptions: {shadowAlpha: 0, barWidth: 5}
            },
            grid: {drawGridlines: false},
            title: "Phenology",
            axes: {
                xaxis: {
                    label: 'Month',
                    renderer: jQuery.jqplot.CategoryAxisRenderer,
                    labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                    ticks: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
                },
                yaxis: {
                    label: 'Number of Records',
                    labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                    min: 0,
                    tickOptions: {formatString: '%i'},
                    showTickMarks: false
                }
            }
        }
    );
};
