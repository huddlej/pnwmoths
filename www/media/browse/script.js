(function($) {
$.fn.implement_browse = function () {
    // Set width to fix jerky slidetoggle
    // +1 to account for #bd's children
    var parentOffset = jQuery(this).parents('.browse_item').length + 1; 
    jQuery(this).width(jQuery('#bd').width() - 10*parentOffset);
    jQuery(this).find('.ajax').width(jQuery('#bd').width() - 10*parentOffset);

    // set h3 size to improve nesting
    if (jQuery(this).parents('.browse_item').length) {
        var curFontSize = jQuery(this).parents('.browse_item').find('h3').css('fontSize');
        var finalNum = parseFloat(curFontSize, 10)/1.2;
        var stringEnding = curFontSize.slice(-2);
        jQuery(this).find('h3').css('fontSize', finalNum + stringEnding);
    }

    // Add collapsing arrow to div
    jQuery(this).find('.browse_heading').prepend('<img src="http://i.imgur.com/ETq1Y.png" class="toggle_item" />');
    // Give the arrow toggle states
    jQuery(this).find('.toggle_item').toggle(
        function(){ jQuery(this).attr("src", "http://i.imgur.com/WtKF5.png"); },
        function(){ jQuery(this).attr("src", "http://i.imgur.com/ETq1Y.png"); }
    );

    // Toggle on click
    jQuery(this).find('.toggle_item').click(function() {
        if (jQuery(this).parent().siblings('.ajax').html().length) {
            jQuery(this).parent().siblings('.browse_thumbs').slideToggle('slow');
            jQuery(this).parent().siblings('.ajax').slideToggle('slow');
        } else {
            // AJAX Load
            var url = jQuery(this).parent().find('h3 a').attr('href');
            jQuery(this).attr("src", "http://i.imgur.com/HgnWu.gif");
            jQuery(this).parent().siblings('.ajax').load(url + ' .browse_item', function() {
                jQuery(this).parent().find('.toggle_item').attr("src", "http://i.imgur.com/WtKF5.png");
                jQuery(this).siblings('.browse_thumbs').slideToggle('slow');
                // BASICALLY, WE ADD +/- AND FUNCTIONALITY
                // Apply THIS_FUNC() to jQuery(this) and below
                jQuery(this).append('<div style="height: 0px; clear: both;">&nbsp;</div>');
                jQuery(this).find('.browse_item:not(.species)').implement_browse();
                jQuery(this).implement_species_width();
                jQuery(this).slideToggle('slow');
                return false;
            });
        }
    });

}

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
    jQuery('#bd').find('.browse_item:not(.species)').implement_browse();

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
