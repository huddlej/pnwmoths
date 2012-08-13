jQuery(document).ready(function() {
    var image_dom;

    // Remove styles for users without javascript.
    jQuery(".all-images").removeClass("all-images-no-js");

    if (jQuery("#images .other-images").length > 0) {
        jQuery("#carousel-other-images").elastislide({
            imageW: 140,
            minItems: 2
        });

        jQuery("#images .other-images a").tipTip();

        jQuery("#images .other-images a").click(function (event) {
            event.preventDefault();
            jQuery("#slideshow-copyright").html(jQuery("#tiptip_content").html()); // Underneath image copyright

            var img_link = jQuery(this).parent().children("span.inline-species-image");
            if ( img_link.hasClass("missing_zoomify") ) {
                // old
                jQuery("#old-image-factsheet").removeClass("hidden");
                jQuery("#zoomify-factsheet").addClass("hidden");
                jQuery("#old-image-factsheet a").replaceWith(jQuery(this).clone());
                image_dom = jQuery("#old-image-factsheet a img");
                image_dom.attr("src", img_link.text());
                jQuery("#old-image-factsheet a").colorbox();
            } else {
                jQuery("#old-image-factsheet").addClass("hidden");
                jQuery("#zoomify-factsheet").removeClass("hidden");
                Z.Viewer.setImagePath(img_link.text());
            }
        });

        // Check for a zoomified image to initialize the viewer with

        var initZ = jQuery(".inline-species-image:not(.missing_zoomify)").first();
        if (initZ.length) {
            jQuery("#zoomify-factsheet").removeClass("hidden");
            jQuery("#zoomify-factsheet").width(jQuery("#zoomify-factsheet").width());
            var h = jQuery("#zoomify-factsheet").width() * (2/3);
            jQuery("#zoomify-factsheet").height(h+1);

            // Temporary fix until navigator is fixed in IE
            if (jQuery.browser.msie)
                Z.showImage("zoomify-factsheet", initZ.text(), "zToolbarVisible=1&zNavigatorVisible=0&zKeys=0&zSkinPath=/media/zoomify/Skins/Default");
	    else if (jQuery(window).width() < 500)
                Z.showImage("zoomify-factsheet", initZ.text(), "zToolbarVisible=1&zNavigatorVisible=0&zFullPageVisible=0&zKeys=0&zSkinPath=/media/zoomify/Skins/Default");
            else
                Z.showImage("zoomify-factsheet", initZ.text(), "zToolbarVisible=1&zNavigatorVisible=2&zKeys=0&zSkinPath=/media/zoomify/Skins/Default");
        }

        if (jQuery(".inline-species-image").first().hasClass("missing_zoomify")) {
            jQuery("#zoomify-factsheet").addClass("hidden");
            jQuery("#old-image-factsheet").removeClass("hidden");
            jQuery("#old-image-factsheet a").colorbox();
        }

        // Copyright for zoomify is hacked into to the zoomify script
        // grep for "Philip Bjorge"
        jQuery(document).bind('cbox_open', function() {
             jQuery("#slideshow-copyright").toggleClass("fullscreen_copyright");
        });
        jQuery(document).bind('cbox_closed', function() {
             jQuery("#slideshow-copyright").toggleClass("fullscreen_copyright");
        });

        //jQuery(window).resize();
	jQuery(window).trigger("resize.elastislide")
    }
});
