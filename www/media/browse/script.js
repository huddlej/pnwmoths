jQuery(document).ready(function() {
    // Make entire div clickable using first link in the container
    jQuery(".browse_item").click(function(){
        window.location=jQuery(this).find("h3 a").attr("href");
        return false;
    });

    // Set div's hover effect
    jQuery(".browse_item").hover(function() {
        jQuery(this).toggleClass('browse_item_hover');
    });

    // Add collapsing arrow to div
    jQuery('.browse_item:not(.species) .browse_heading').append('<img src="http://i.imgur.com/R5I0z.jpg" class="toggle_item" />');
    // Give the arrow toggle states
    jQuery('.browse_item .browse_heading .toggle_item').toggle(
        function(){ jQuery(this).attr("src", "http://i.imgur.com/OiJKx.jpg"); },
        function(){ jQuery(this).attr("src", "http://i.imgur.com/R5I0z.jpg"); }
    );
    // Toggle on click
    jQuery('.browse_item .browse_heading .toggle_item').click(function() {
        jQuery(this).parent().siblings('.browse_thumbs').slideToggle('slow');
        return false;
    });

});
