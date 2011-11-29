jQuery(document).ready(function() {
    var image_dom;

    // Remove styles for users without javascript.
    jQuery(".all-images").removeClass("all-images-no-js");
    jQuery(".no-js").hide();

    if (jQuery("#images .other-images").length > 0) {
        jQuery("#images .other-images").jcarousel({
            scroll: 2
        });

        jQuery("#images .other-images a").click(function (event) {
            event.preventDefault();
            jQuery("#images .current-image a").replaceWith(jQuery(this).clone());
            image_dom = jQuery("#images .current-image a img");
            image_dom.attr("src", jQuery(this).parent().children("a.medium-thumbnail").attr("href"));
            jQuery("#images .current-image a").colorbox();
        });
        jQuery("#images .current-image a").colorbox();
    }
});
