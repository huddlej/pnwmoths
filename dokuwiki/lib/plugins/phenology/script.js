jQuery(document).ready(function () {
    var data = [],
        rowData,
        table = jQuery("table.phenology");
    table.hide();
    jQuery.each(
        jQuery("table.phenology tbody").children(),
        function (i) {
            data.push(parseInt(jQuery(this).children("td:last").text()));
        }
    );

    jQuery.jqplot(
        "plot",
        [data],
        {
            seriesDefaults: {
                renderer: jQuery.jqplot.BarRenderer,
                rendererOptions: {shadowAlpha: 0}
            },
            grid: {drawGridlines: false},
            title: table.children("caption").text(),
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
});
