jQuery(document).ready(function () {
    var species = jQuery("#species").hide().text();

    jQuery.get(
        "http://localhost/~huddlej/service.php",
        {
            "method": "getPhenology",
            "arg1": species
        },
        function (data, textStatus) {
            var phenology = [];
            jQuery(data).children().children().each(
                function () {
                    if (jQuery(this).text() != "success") {
                        phenology.push(parseInt(jQuery(this).text()));
                    }
                }
            );

            return new Phenology(species, phenology);
        }
    );
});

function Phenology (species, data) {
    jQuery.jqplot(
        "plot",
        [data],
        {
            seriesDefaults: {
                renderer: jQuery.jqplot.BarRenderer,
                rendererOptions: {shadowAlpha: 0}
            },
            grid: {drawGridlines: false},
            title: species + " Phenology",
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
