jQuery(document).ready(function() {
    // Set dropdown icon for breadcrumbs with menus
    jQuery('.megamenu').prev('.crumb_no_arrow').addClass('crumb_arrow');

    // Position each megamenu so that it displays in our main content div
    jQuery('.megamenu').each(function() {
        o = jQuery(this).parent('li').offset();
        o.top += jQuery(this).parent('li').height();
        jQuery(this).offset(o);

            // show off screen for width
            jQuery(this).css({'visibility':'hidden','display':'block'});
            pos = jQuery(this).position();
            w = jQuery(this).width();
            jQuery(this).css({'visibility':'visible','display':'none'});

        // check width against body div
        rbound = jQuery('#body').position().left+jQuery('#body').width();
        if ((pos.left+w) > rbound){
            curr = jQuery(this).children('.megacontent').offset();
            // move left until its inside
            curr.left -= pos.left+w-rbound;
            jQuery(this).children('.megacontent').css('border-top-left-radius', '10px').offset(curr);
        }
    });

    // Changing tails width to match its breadcrumb
    jQuery('.tail').each(function() {
        jQuery(this).width(jQuery(this).parent('li').width()-17);
    });

    // give alternate class for link coloring
    jQuery(document).ready(function(){
        jQuery('.megamenu ul li:nth-child(odd)').addClass('alternate');
    });              
    
    // show submenu on click
    jQuery('.megamenu').prev('.crumb_arrow').click(function(event){
        jQuery('.megamenu').not(jQuery(this).next('.megamenu')).hide('fast');
        jQuery('.crumb_arrow_down').removeClass('crumb_arrow_down');
        jQuery(this).next('.megamenu').slideToggle('fast');
        jQuery(this).addClass('crumb_arrow_down');
        event.stopPropagation();
    });

    // Stops click from propogating up to html and closing our submenu
    // if the click takes place on our submenu
    jQuery('.megamenu').click(function(event){
        if (jQuery(this).is(":visible") == true){
            event.stopPropagation();
        }
    });

    // hover effect for dropdown
    jQuery('.megamenu').prev('span').hover(
        function(){
            jQuery(this).addClass('crumb_arrow_down');
        },
        function(){
           if (jQuery(this).next('.megamenu').is(':hidden')){
               jQuery(this).removeClass('crumb_arrow_down');
            }
        }
    );

    // hide menus if we click outside of them
    jQuery('html').click(function() {
        //Hide the menus if visible
        jQuery('.crumb_arrow_down').click();
        jQuery('.crumb_arrow_down').removeClass('crumb_arrow_down');
    });                                    
});
