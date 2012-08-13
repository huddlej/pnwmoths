(function($) {
    $(document).ready(function($) {
	    $('h2:contains("Filter")').after('<h2><a style="color: black" href="?">Clear Filters</a></h2><h3>By record type</h3><ul></ul>');
            var heading = $('h3:contains("By record type")');
            var FilterOptions = [{
                                    'title': 'Label',
                                    'qs': [{name: 'speciesimage__isnull', value: 'False'},],
                                },{
                                    'title': 'Record',
                                    'qs': [{name: 'speciesimage__isnull', value: 'True'},],
                                }];
            Filter($, heading, FilterOptions);
    });
})(django.jQuery);
