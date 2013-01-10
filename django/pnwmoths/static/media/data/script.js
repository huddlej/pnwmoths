// Global storage for data sets indexed by data set name.
var PNWMOTHS = PNWMOTHS || {};
PNWMOTHS.Data = function () {
    return {
        data: {},
        getCallback: function (data_name) {
            return function (new_data, textStatus) {
                // Update global data variable.
                PNWMOTHS.Data.data[data_name] = new_data;

                // Trigger "data is ready" event for this data set.
                jQuery("#" + data_name).trigger("dataIsReady", [new_data]);
            };
        }
    };
}();

jQuery(document).ready(function () {
    // All data set declarations have the dokuwiki-data class.  For each data
    // set declaration, parse the contents of the container and make a request
    // to the data service based on the arguments found.
    jQuery(".dokuwiki-data").each(function () {
        var i,
            data_name,
            requestData = {},
            dataset = null;

        // Each data set declaration should contain a valid JSON string
        // containing an object with at least a data set name and a method to
        // call in the data service.
        //
        // Each declaration may optionally include an "args" property which
        // declares arguments to be passed to the specified method.
        if (jQuery(this).text().length > 0) {
            dataset = jQuery.parseJSON(jQuery(this).text());
        }

        // Use an empty data set if the declaration is empty.
        if (dataset == null) {
            dataset = [];
        }

        data_name = jQuery(this).attr("id");

        // If the declaration is missing required values but is valid JSON then
        // the data was dumped directly by the plugin and nothing more needs to
        // be done.
        if (typeof(dataset._service_url) == "undefined" ||
            typeof(dataset._name) == "undefined") {
            PNWMOTHS.Data.getCallback(data_name)(dataset);
        }
        else {
            // Remove plugin options from request data.
            jQuery.each(dataset, function (key, value) {
                // Plugin options are all prefixed by an underscore character
                // like "_name".
                if (key[0] != "_") {
                    requestData[key] = value;
                }
            });

            // Create a custom event to request this data set for other
            // applications that need to re-request data later.
            jQuery("#" + data_name).bind("requestData", function (event) {
                jQuery.getJSON(
                    dataset._service_url,
                    requestData,
                    PNWMOTHS.Data.getCallback(data_name)
                );
            });

            // Trigger the initial request to the data service.
            jQuery("#" + data_name).trigger("requestData");
        }
    });
});