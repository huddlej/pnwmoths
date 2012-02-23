// Implements recursive, nested, AJAX-loaded tree browsing.
// http://pnwmoths.biol.wwu.edu/browse/

(function($) {
    $.fn.implement_browse = function () {
        // Set width to fix jerky slidetoggle
        // +1 to account for #body children
        var parentOffset = jQuery(this).parents('.browse_item').length + 1; 
        jQuery(this).width(jQuery('.twelvecol').width() - 10*parentOffset);
        jQuery(this).find('.ajax').width(jQuery('.twelvecol').width() - 10*parentOffset);

        // set h3 size to improve visual nesting
        if (jQuery(this).parents('.browse_item').length) {
            var curFontSize = jQuery(this).parents('.browse_item').find('h3').css('fontSize');
            var finalNum = parseFloat(curFontSize, 10)/1.2;
            var stringEnding = curFontSize.slice(-2);
            jQuery(this).find('h3').css('fontSize', finalNum + stringEnding);
        }

        // Add collapsing button to div
        jQuery(this).find('.browse_heading').prepend('<a class="toggle_item button">+</a>');
        // Give the button toggle states
        jQuery(this).find('.toggle_item').toggle(
            function(){ jQuery(this).html("-"); },
            function(){ jQuery(this).html("+"); }
        );

        // Make images clickable
        jQuery(this).find('.browse_thumbs').click(function() {
            jQuery(this).siblings('.browse_heading').find('.toggle_item').click();
        });

        // Toggle on click
        jQuery(this).find('.toggle_item').click(function() {
            if (jQuery(this).parent().siblings('.ajax').html().length) {
                jQuery(this).parent().siblings('.browse_thumbs').slideToggle('slow');
                jQuery(this).parent().siblings('.ajax').slideToggle('slow');
            } else {
                // AJAX Load
                var url = jQuery(this).parent().find('h3 a').attr('href');
                jQuery(this).html('&nbsp;');
                jQuery(this).addClass('loading_toggle');
                jQuery(this).parent().siblings('.ajax').load(url + ' .browse_item', function() {
                    jQuery(this).parent().find('.toggle_item').removeClass('loading_toggle').html("-");
                    jQuery(this).append('<div style="height: 0px; clear: both;">&nbsp;</div>');
                    jQuery(this).find('.browse_item:not(.species)').implement_browse();
                    jQuery(this).implement_species_width();

                    // Hide images and skip wait if we are in advanced mode
                    if (jQuery('#browse_images_toggle').hasClass('browse_checked')) {
                        jQuery('.browse_thumbs img').hide();
                        jQuery(this).siblings('.browse_thumbs').slideToggle('slow');
                        jQuery(this).slideToggle('slow');
                    }
                    else 
                    {
                        jQuery(this).waitForImages(function() {
                            jQuery(this).siblings('.browse_thumbs').slideToggle('slow');
                            jQuery(this).slideToggle('slow');
                        });
                    }
                    return false;
                });
            }
        });
    }

    // Sets the species level width based on how many species we have
    $.fn.implement_species_width = function() {
        var count = jQuery(this).children('.species').length;
        if (count <= 6) {
            jQuery(this).children('.species').width('46%');
            jQuery(this).children('.species:nth-child(2n+1)').css("clear", "both");
        }
        else if (6 < count && count <= 20) {
            jQuery(this).children('.species').width('30%');
            jQuery(this).children('.species:nth-child(3n+1)').css("clear", "both");
        }
        else {
            jQuery(this).children('.species').width('23%');
            jQuery(this).children('.species:nth-child(4n+1)').css("clear", "both");
        }
    }

})(jQuery);


jQuery(document).ready(function() {
    jQuery('#body').find('.browse_item:not(.species)').implement_browse();

    // Toggle functions for advanced, image-free browsing
    jQuery('#browse_images_toggle').toggle(
        function(){ jQuery(this).html("Turn on Images?"); jQuery(this).addClass('browse_checked'); jQuery('.browse_thumbs img').hide(); },
        function(){ jQuery(this).html("Turn off Images?"); jQuery(this).removeClass('browse_checked'); jQuery('.browse_thumbs img').show(); }
    );

    //Make species div clickable using first link in the container
    jQuery(".ajax").delegate(".species" ,"click", function(){
        window.location=jQuery(this).find("h3 a").attr("href");
        return false;
    });

    // Set species div's hover effect
    jQuery(".ajax").delegate(".species", "hover", function() {
        jQuery(this).toggleClass('browse_item_hover');
    });
});
