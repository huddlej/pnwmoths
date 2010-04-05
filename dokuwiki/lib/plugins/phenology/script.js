jQuery(document).ready(function () {
    var species = jQuery("#species").hide().text();

    jQuery.getJSON(
        "http://localhost/~huddlej/service.php",
        {
            "method": "getPhenology",
            "species": species
        },
        function (data, textStatus) {
            return new Phenology(species, data);
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

    jQuery("#plot").hide();
};
