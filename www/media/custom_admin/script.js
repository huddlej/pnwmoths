;(function($){ $(document).ready(function(){
    $('#changelist-filter > h3').each(function(){
        var $title = $(this);
        $title.click(function(){
            $title.next().slideToggle();
        });
        var t = $title.text();
        $(this).text("+ " + t);
        $title.toggle(function() {
            $(this).text("- " + t);
        }, function() {
            $(this).text("+ " + t);
        });
        $title.next().toggle();
    });
    var toggle_flag = true;
    $('#changelist-filter > h2').click(function () {
        toggle_flag = ! toggle_flag;
        $('#changelist-filter > ul').each(function(){
                $(this).toggle(toggle_flag);
        });
    });
  });
})(django.jQuery);
