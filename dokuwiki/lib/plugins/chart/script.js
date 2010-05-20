/*
 * The PNWMOTHS namespace includes the following sections:
 *
 * - Chart: methods for displaying a chart of seasonality data
 */

var PNWMOTHS = PNWMOTHS || {};
PNWMOTHS.Chart = function () {
    return {
        charts: {},
        initialize: function (chart_element, data) {
            var phenologyData = [],
                flatPhenologyData = [],
                startInterval = 0,
                endInterval = 12,
                daysPerSegment = 10,
                maxSegments = 2,
                i, j,
                plot,
                month, segment,
                ticks = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
                dataLabels = [],
                tick;

            // Prepare data labels.

            // Build a sequence of tick values consisting of one month letter and n
            // empty values for all months where n is the number of segments per month
            // in the phenology minus 1. For example: ["J", "", "", "F", "", "",...] for
            // n=3.
            for (tick in ticks) {
                dataLabels.push(ticks[tick]);
                for (i = 0; i <= maxSegments - 1; i++) {
                    dataLabels.push(" ");
                }
            }

            if (data.length == 0) {
                return PNWMOTHS.Chart.render(chart_element, [flatPhenologyData], dataLabels);
            }

            // Pre-populate samples by interval with zeros.
            for (i = startInterval; i < endInterval; i++) {
                    phenologyData[i] = [];
                // One value per segment per month in the phenology.
                for (j = 0; j <= maxSegments; j++) {
                    phenologyData[i][j] = 0;
                }
            }

            // Map sample data to the given interval by counting each sample
            // that matches an interval marker.
            for (i in data) {
                if (data.hasOwnProperty(i) && data[i].month) {
                    // If a record doesn't have a "day" value, don't use it. It is
                    // better to omit a record than mislead users by defaulting the
                    // record to the beginning of the month or some other similar
                    // strategy.
                    if (data[i].day) {
                        // Records are indexed starting with 0 so all months are shifted
                        // by 1.
                        month = parseInt(data[i].month) - 1;

                        // If a record has a day value, place it in the right segment.
                        segment = Math.floor(parseInt(data[i].day) / daysPerSegment);

                        // The graph will never display more than the max number of
                        // segments, so days 30 and 31 get placed into the last segment.
                        segment = Math.min(segment, maxSegments);

                        // Count the number of records for this month and this segment.
                        phenologyData[month][segment] += 1;
                    }
                }
            }

            // Flatten nested phenology data into a single list.
            for (i in phenologyData) {
                for (j in phenologyData[i]) {
                    flatPhenologyData.push(phenologyData[i][j]);
                }
            }

            // Prepare data for jqPlot by nesting our single data set in a list
            // of data sets.
            return PNWMOTHS.Chart.render(chart_element, [flatPhenologyData], dataLabels);
        },
        render: function (chart_element, data, dataLabels) {
            var y_max, min_data_value = 3;

            // jqPlot requires the placeholder div to be visible in the DOM when
            // the plot is created. Each time a new plot is generated the div
            // needs to be emptied and shown. After the plot is generated, the
            // div can be hidden again.
            plotDiv = jQuery("#" + chart_element);
            plotDiv.empty();
            plotDiv.show();

            // Set a maximum value for the y-axis based on the maximum value of
            // the current data set plus a buffer.
            y_max = Math.max.apply(Math, data[0]);

            // Determine the buffer to add to the y-axis maximum based on the
            // maximum value. If the value is too small, jqPlot will add
            // multiple zeros to the y-axis. To avoid this problem, add the
            // minimum data value as a buffer. In all other cases, just add one
            // extra value.
            if (y_max < min_data_value) {
                y_max = y_max + min_data_value;
            }
            else {
                y_max = y_max + 1;
            }

            // Return a new jqPlot. This mostly consists of a lot of jqPlot
            // options.
            return jQuery.jqplot(
                chart_element,
                data,
                {
                    seriesDefaults: {
                        renderer: jQuery.jqplot.BarRenderer,
                        rendererOptions: {shadowAlpha: 0, barWidth: 5}
                    },
                    grid: {drawGridlines: false},
                    title: "Flight Season",
                    axes: {
                        xaxis: {
                            label: 'Month',
                            renderer: jQuery.jqplot.CategoryAxisRenderer,
                            labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                            ticks: dataLabels
                        },
                        yaxis: {
                            min: 0,
                            max: y_max,
                            label: 'Number of Records',
                            labelRenderer: jQuery.jqplot.CanvasAxisLabelRenderer,
                            tickOptions: {formatString: '%i'},
                            showTickMarks: false
                        }
                    }
                }
            );
        }
    };
}();

jQuery(document).ready(function () {
    // For each chart declaration in the current document, determine the data
    // source to listen to and initialize a chart with the data found at that
    // source.
    jQuery.each(jQuery(".chart"), function (index, chart) {
        var data_id, data_name;

        // A class specifying the data source is required. Don't continue if it
        // doesn't exist.
        if (jQuery(chart).children(".data").length > 0) {
            data_name = jQuery(chart).children(".data").text();
            data_id = "#" + data_name;

            jQuery(data_id).bind(
                "dataIsReady",
                function (event, data) {
                    var chart_instance = PNWMOTHS.Chart.initialize(
                        jQuery(chart).attr("id"),
                        data
                    );
                    PNWMOTHS.Chart.charts[jQuery(chart).attr("id")] = chart_instance;
                }
            );
        }
    });
});