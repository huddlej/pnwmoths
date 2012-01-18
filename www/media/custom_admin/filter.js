function Filter($, heading, FilterOptions) {
    var filtergroup = heading.next('ul');
    // Query String to objext
    var qs = {};
    window.location.search.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) { qs[$1] = $3; }
    );

    // Remove all filters from querystring
    $.each(FilterOptions, function(index, option){
        $.each(option.qs, function(i, v) {
            if (v.name in qs){
                if (qs[v.name] == v.value){
                    delete qs[v.name];
                }
            }
        });
    });

    var stripped_qs = qs;

    // Add All filter
    filtergroup.append('<li class="selected"><a href="?'+ $.param(qs) +'">All</a></li>');
    
    $.each(FilterOptions, function(index, option){
        qs = stripped_qs;

        $.each(option.qs, function(i, v) {
            qs[v.name] = v.value;
        });

        filtergroup.append('<li><a href="?'+ $.param(qs) +'">'+ option.title +'</a></li>');

        // Set Selected
        var sel = true;
        var currentfilter = filtergroup.children('li:last');
        $.each(option.qs, function(i, v) {
             if (!window.location.search.match($.param([v]))) {
                sel = false;
            }
        });
        if(sel) {
            currentfilter.addClass('selected');
            currentfilter.siblings().each(function(){
                $(this).removeClass('selected');
            });
        }
    });
}
