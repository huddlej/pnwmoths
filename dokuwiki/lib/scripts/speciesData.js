var species,
    data,
    filters = {};

jQuery(document).ready(function () {
    species = jQuery("#species").hide().text();

    //
    // Setup filters.
    //

    // All filters
    jQuery("#clear-filters").click(
        function (event) {
            event.preventDefault();
            filters = {};
            jQuery("#filters input:text").val("");
            jQuery(document).trigger("requestData");
        }
    );

    // Elevation
    jQuery("#form-elevation").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#startelevation").val(),
                end = jQuery("#endelevation").val();
            filters["elevation"] = [start, end];
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#clear-filter-elevation").click(
        function (event) {
            event.preventDefault();
            if (filters.hasOwnProperty("elevation")) {
                delete filters["elevation"];
                jQuery(this).siblings("input:text").val("");
                jQuery(document).trigger("requestData");
            }
        }
    );

    // Date
    jQuery("#form-date").submit(
        function (event) {
            event.preventDefault();
            var start = jQuery("#startdate").val(),
                end = jQuery("#enddate").val();
            filters["date"] = [start, end];
            jQuery(document).trigger("requestData");
        }
    );
    jQuery("#clear-filter-date").click(
        function (event) {
            event.preventDefault();
            if (filters.hasOwnProperty("date")) {
                delete filters["date"];
                jQuery(this).siblings("input:text").val("");
                jQuery(document).trigger("requestData");
            }
        }
    );

    jQuery(document).bind("requestData", function (event) { getData(species, filters); });
    jQuery(document).trigger("requestData");
});

function getData(species, filters) {
    var key,
        requestData = {
            "method": "getSamples",
            "species": species
        };

    // Add filter values to the request data.
    for (key in filters) {
        if (filters.hasOwnProperty(key)) {
           requestData[key] = filters[key];
        }
    }

    jQuery.getJSON(
        "http://localhost/~huddlej/service.php",
        requestData,
        function (new_data, textStatus) {
            // Update global data variable.
            data = new_data;

            // Trigger "data is ready" event.
            jQuery(document).trigger("dataIsReady");
        }
    );
}
