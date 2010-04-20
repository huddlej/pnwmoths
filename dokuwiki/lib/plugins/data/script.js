// Global storage for data sets indexed by data set name.
var dokuwiki_data = {};

jQuery(document).ready(function () {
    // All data set declarations have the dokuwiki-data class.  For each data
    // set declaration, parse the contents of the container and make a request
    // to the data service based on the arguments found.
    jQuery(".dokuwiki-data").each(function () {
        var i,
            data_name,
            requestData,
            dataset;

        // Each data set declaration should contain a valid JSON string
        // containing an object with at least a data set name and a method to
        // call in the data service.
        //
        // Each declaration may optionally include an "args" property which
        // declares arguments to be passed to the specified method.
        dataset = jQuery.parseJSON(jQuery(this).text());

        // Stop processing this data set if the declaration is empty or missing
        // required values.
        if (dataset == null ||
            typeof(dataset._service_url) == "undefined" ||
            typeof(dataset.name) == "undefined" ||
            typeof(dataset.method) == "undefined") {
            return;
        }

        requestData = {"method": dataset.method};

        // Loop through optional arguments and add them to the request data.
        for (i in dataset.args) {
            if (dataset.args.hasOwnProperty(i)) {
                requestData[i] = dataset.args[i];
            }
        }

        // Create a custom event to request this data set for other applications
        // that need to re-request data later.
        data_name = jQuery(this).attr("id");
        jQuery("#" + data_name).bind("requestData", function (event) {
            jQuery.getJSON(
                dataset._service_url,
                requestData,
                getCallback(data_name)
            );
        });

        // Trigger the initial request to the data service.
        jQuery("#" + data_name).trigger("requestData");
    });
});

function getCallback(data_name) {
    return function (new_data, textStatus) {
        // Update global data variable.
        dokuwiki_data[data_name] = new_data;

        // Trigger "data is ready" event for this data set.
        jQuery("#" + data_name).trigger("dataIsReady");
    }
}