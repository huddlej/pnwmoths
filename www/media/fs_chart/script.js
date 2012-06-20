/*
 * The PNWMOTHS namespace includes the following sections:
 *
 * - Chart: methods for displaying a chart of seasonality data
 */

var PNWMOTHS = PNWMOTHS || {};
PNWMOTHS.Chart = function () {
    return {
        charts: {},
        prepareDataLabels: function (labels, padding_amount, padding_value) {
            // Pads each of the given labels by the given amount of the given
            // padding value.
            //
            // For example: ["J", " ", " ", "F", " ", " ",...] for n=3.
            //
            var data_labels = [],
                label,
                padding_value = padding_value || " ";

            for (label in labels) {
                if (labels.hasOwnProperty(label)) {
                    data_labels.push(labels[label]);
                    for (i = 0; i < padding_amount; i++) {
                        data_labels.push(padding_value);
                    }
                }
            }

            return data_labels;
        },
        flattenData: function (data) {
            // Flatten nested phenology data into a single list.
            var flat_data = [];

            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    for (j in data[i]) {
                        if (data[i].hasOwnProperty(j))
                            flat_data.push(data[i][j]);
                    }
                }
            }

            return flat_data;
        },
        sumDataByMonthAndSegment: function (data, days_per_segment, max_segments) {
            var phenology_data = [],
                start_interval = 0,
                end_interval = 12,
                days_per_segment = days_per_segment || 10,
                max_segments = max_segments || 2,
                i, j,
                segment,
                month;

            // Pre-populate samples by interval with zeros.
            for (i = start_interval; i < end_interval; i++) {
                phenology_data[i] = [];
                // One value per segment per month in the phenology.
                for (j = 0; j <= max_segments; j++) {
                    phenology_data[i][j] = 0;
                }
            }

            // Map sample data to the given interval by counting each sample
            // that matches an interval marker.
            for (i in data) {
                // If a record is missing a day and/or month ignore the record. It is
                // better to omit an incomplete record than mislead users by defaulting the
                // record.
                if (data.hasOwnProperty(i) && data[i].month && data[i].day) {
                    // Records are indexed starting with 0 so all months are
                    // shifted by 1.
                    month = parseInt(data[i].month) - 1;

                    if (0 <= month && month <= 11) {
                        // If a record has a day value, place it in the right
                        // segment.
                        segment = Math.floor(parseInt(data[i].day) / days_per_segment);

                        // The graph will never display more than the max number
                        // of segments, so days 30 and 31 get placed into the last
                        // segment.
                        segment = Math.min(segment, max_segments);

                        // Count the number of records for this month and this segment.
                        phenology_data[month][segment] += 1;
                    }
                }
            }

            return phenology_data;
        },
        initialize: function (chart_element, data, custom_options) {
            var phenology_data = [],
                days_per_segment = 10,
                max_segments = 2,
                ticks = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

            if (data.length > 0) {
                phenology_data = this.sumDataByMonthAndSegment(
                    data, 
                    days_per_segment,
                    max_segments
                );
                phenology_data = this.flattenData(phenology_data);
            }

            // Prepare data for jqPlot by nesting our single data set in a list
            // of data sets.
            return this.render(
                chart_element,
                [phenology_data],
                this.prepareDataLabels(ticks, max_segments),
                custom_options
            );
        },
        render: function (chart_element, data, dataLabels, custom_options) {
            var y_max, min_data_value = 3,
                default_options,
                options,
                plot_div;

            // jqPlot requires the placeholder div to be visible in the DOM when
            // the plot is created. Each time a new plot is generated the div
            // needs to be emptied and shown. After the plot is generated, the
            // div can be hidden again.
            plot_div = jQuery("#" + chart_element);
            plot_div.empty();
            plot_div.show();

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

            default_options = {
                seriesDefaults: {
                    renderer: jQuery.jqplot.BarRenderer,
                    rendererOptions: {shadowAlpha: 0, barWidth: 5}
                },
                grid: {drawGridlines: false},
                series:[{color:'#333'}],
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
            };
            options = jQuery.extend(true, {}, default_options, custom_options);

            // Return a new jqPlot. This mostly consists of a lot of jqPlot
            // options.
            return jQuery.jqplot(
                chart_element,
                data,
                options
            );
        }
    };
}();

jQuery(document).ready(function () {
    // For each chart declaration in the current document, determine the data
    // source to listen to and initialize a chart with the data found at that
    // source.

    jQuery(window).resize(function(event, ui) {
        jQuery.each(PNWMOTHS.Chart.charts, function(i,p) {
            p.replot();
        });
    });

    jQuery.each(jQuery(".chart"), function (index, chart) {
        var data_id, data_name, options;

        // A class specifying the data source is required. Don't continue if it
        // doesn't exist.
        if (jQuery(chart).children(".data").length > 0) {
            data_name = jQuery(chart).children(".data").text();
            data_id = "#" + data_name;

            // If no options were specified, just use an empty object.
            options = jQuery.parseJSON(jQuery(chart).children(".options").text());
            if (options == "") {
                options = {};
            }

            jQuery(data_id).bind(
                "dataIsReady",
                // TODO: move this function into Charts class for testing.
                function (event, data) {
                    if (data.length == 0)
                        data = [[null]];    // Empty data plot fix

                    var chart_instance = PNWMOTHS.Chart.initialize(
                        jQuery(chart).attr("id"),
                        data,
                        options
                    );
                    PNWMOTHS.Chart.charts[jQuery(chart).attr("id")] = chart_instance;
                }
            );
        }
    });
     var $ = jQuery;
     $('#plot').bind('jqplotDataHighlight', 
        function (ev, seriesIndex, pointIndex, data ) {
            var mouseX = ev.pageX; //these are going to be how jquery knows where to put the div that will be our tooltip
            var mouseY = ev.pageY;
            $('#chartpseudotooltip').html(data[1]);
            var cssObj = {
                  'position' : 'absolute',
                  'font-weight' : 'bold',
		  'background' : 'rgba(255,255,255,0.7)',
		  'border' : '1px solid black',
		  'padding' : '0px 2px 0px 2px',
		  'font-size' : '.8em',
                  'left' : (mouseX+15) + 'px', //usually needs more offset here
                  'top' : (mouseY-10) + 'px'
                };
            $('#chartpseudotooltip').css(cssObj);
	    $('#chartpseudotooltip').show();
            }
    );    

    $('#plot').bind('jqplotDataUnhighlight', 
        function (ev) {
	    $('#chartpseudotooltip').hide();
            $('#chartpseudotooltip').html('');
        }
    );
    
});
