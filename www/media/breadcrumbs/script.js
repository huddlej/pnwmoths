jQuery(document).ready(function() {
    // Add dropdown clicker
    jQuery('.crumb_no_arrow').removeClass('.crumb_no_arrow').addClass('crumb_arrow');

    // hover effect for dropdown
    jQuery('.crumb_arrow').hover(
        function(){
            jQuery(this).addClass('crumb_arrow_down');
        },
        function(){
           if (jQuery(this).next('.megamenu').is(':hidden')){
               jQuery(this).removeClass('crumb_arrow_down');
            }
        }
    );

    // give alternate class for link coloring
    jQuery('.megamenu ul li:nth-child(odd)').addClass('alternate');

    // Stops click from propogating up to html and closing our submenu
    // if the click takes place on our submenu
    jQuery('.megamenu').click(function(event){
        if (jQuery(this).is(":visible") == true){
            event.stopPropagation();
        }
    });

    // hide menus if we click outside of them
    jQuery('html').click(function() {
        //Hide the menus if visible
        jQuery('.crumb_arrow_down').click();
        jQuery('.crumb_arrow_down').removeClass('crumb_arrow_down');
    });

	// show/hide menus on click
    jQuery('.crumb_arrow').click(function(event){
        jQuery('.megamenu').not(jQuery(this).next('.megamenu')).hide('fast');
        jQuery('.crumb_arrow_down').removeClass('crumb_arrow_down');
        jQuery(this).next('.megamenu').slideToggle('fast');
        jQuery(this).addClass('crumb_arrow_down');
        event.stopPropagation();
    });
});
