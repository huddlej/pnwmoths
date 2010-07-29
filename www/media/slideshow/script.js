jQuery(document).ready(function() {
    // Remove styles for users without javascript.
    jQuery(".all-images").removeClass("all-images-no-js");
    jQuery(".no-js").hide();

    if (jQuery("#images .other-images").length > 0) {
        jQuery("#images .other-images").jcarousel();

        jQuery("#images .other-images a").click(function (event) {
            event.preventDefault();
            jQuery("#images .current-image a").replaceWith(jQuery(this).clone());
            jQuery("#images .current-image a").colorbox();
        });
        jQuery("#images .current-image a").colorbox();
    }
});
