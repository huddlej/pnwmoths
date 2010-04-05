var data;

jQuery(document).ready(function () {
    var species = jQuery("#species").hide().text();

    jQuery(document).bind("dataIsReady", function (event) { console.log("Data is ready!"); });

    jQuery.getJSON(
        "http://localhost/~huddlej/service.php",
        {
            "method": "getSamples",
            "species": species,
            "elevation": [2000, 3000]
        },
        function (new_data, textStatus) {
            data = new_data;
            
            // Trigger "data is ready" event.
            jQuery(document).trigger("dataIsReady");
            // "date": ["1990/03/01", "2000/03/01"]
        }
    );
});
