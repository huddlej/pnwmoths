jQuery(document).ready(function() {
    // Set dropdown icon for breadcrumbs with menus
    jQuery('.megamenu').prev('span').css({'background': "url('http://i.imgur.com/UL20q.png')", 'width': '32px'});
    jQuery('.megamenu').prev('span').css('cursor', 'pointer');

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
        // check width against container div
        rbound = jQuery('#bd').position().left+jQuery('#bd').width();
        if ((pos.left+w) > rbound){
            curr = jQuery(this).children('.container').offset();
            curr.left -= pos.left+w-rbound;
            jQuery(this).children('.container').css('border-top-left-radius', '10px').offset(curr);
        }
        // move left until its inside
    });

    // Changing tails width to match its breadcrumb
    jQuery('.tail').each(function() {
        jQuery(this).width(jQuery(this).parent().parent().width()-17);
    });

    // give alternate class for link coloring
    jQuery(document).ready(function(){
        jQuery('.megamenu ul li:nth-child(odd)').addClass('alternate');
    });              
    
    // show submenu on click
    jQuery('.megamenu').prev('span').click(function(event){
        jQuery('.megamenu').not(jQuery(this).next('.megamenu')).hide('fast');
        jQuery('.megamenu').filter(':visible').prev('span').css('background', "url('http://i.imgur.com/UL20q.png')");
        jQuery(this).next('.megamenu').slideToggle('fast');
        jQuery(this).css('background', "url('http://i.imgur.com/fmiHa.png')");
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
            jQuery(this).css('background', "url('http://i.imgur.com/fmiHa.png')");
        },
        function(){
           if (jQuery(this).next('.megamenu').is(':hidden')){
               jQuery(this).css('background', "url('http://i.imgur.com/UL20q.png')");
            }
        }
    );

    // hide menus if we click outside of them
    jQuery('html').click(function() {
        //Hide the menus if visible
        jQuery('.megamenu').filter(':visible').prev('span').click().css('background', "url('http://i.imgur.com/UL20q.png')");
    });                                    
});
