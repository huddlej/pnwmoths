jQuery(document).ready(function() {
    jQuery("#other-images").jcarousel();

    jQuery("#other-images img").click(function () {
        jQuery("#current-image img").replaceWith(jQuery(this).clone());
    });
});
