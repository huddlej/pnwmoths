jQuery(document).ready(function() {
    // Remove styles for users without javascript.
    jQuery(".all-images").removeClass("all-images-no-js");
    jQuery(".no-js").hide();

    if (jQuery("#other-images").length > 0) {
        jQuery("#other-images").jcarousel();

        jQuery("#other-images a").click(function (event) {
            event.preventDefault();
            jQuery("#current-image a").replaceWith(jQuery(this).clone());
            jQuery("#current-image a").colorbox();
        });
        jQuery("#current-image a").colorbox();
    }
});
