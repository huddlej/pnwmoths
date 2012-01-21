;(function($){ $(document).ready(function(){
    $('#changelist-filter > h3').each(function(){
        var $title = $(this);
        $title.click(function(){
            $title.next().slideToggle();
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
