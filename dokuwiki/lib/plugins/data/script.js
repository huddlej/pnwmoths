console.log("hungry!");

jQuery(document).ready(function () {
    var datasets = jQuery(".dokuwiki-data"),
        i;

    if (datasets.length == 0) {
        console.log("no datasets");
        return;
    }

    console.log("oh hai");
    datasets.each(function () {
        console.log(jQuery(this));
    });
});