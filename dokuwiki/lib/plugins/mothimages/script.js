jQuery(document).ready(function() {
    jQuery("#other-images").jcarousel();

    jQuery("#other-images a img").click(function (event) {
        event.preventDefault();
        jQuery("#current-image img").replaceWith(jQuery(this).clone());
    });
});
