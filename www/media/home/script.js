jQuery(window).load(function() {
	jQuery('.blueberry').blueberry({interval: 8000, pager: false});

var mapDiv = jQuery("#googlemap");
mapDiv.show();
var centerPoint = new google.maps.LatLng(46.9, -118.0);
var options = {
                zoom: 4,
                streetViewControl: false,
                center: centerPoint,
                mapTypeId: 'terrain'
            };  
var map = new google.maps.Map(mapDiv[0], options);
var mgr = new MarkerManager(map);
var everythingElse = [
                new google.maps.LatLng(-87, 120),
                new google.maps.LatLng(-87, -87),
                new google.maps.LatLng(-87, 0),];
var pnw = [
              new google.maps.LatLng(40, -126),
              new google.maps.LatLng(52.3, -130),
              new google.maps.LatLng(52.3, -105.0),
              new google.maps.LatLng(40, -105.0),];
var polygon = new google.maps.Polygon({
              paths: [everythingElse, pnw],
              strokeColor: "#003F87",
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: "#000000",
              fillOpacity: .1,
            });
polygon.setMap(map);


    var markers = [];
    jQuery.each(PNWMOTHS.Data.data['all-coords'].objects, function(index, coords) {
        if (coords['latitude'] && coords['longitude']) {
            point = new google.maps.LatLng(coords['latitude'], coords['longitude']);
            var marker = new google.maps.Marker({
                             position: point,
                             map: map,
                             icon: new google.maps.MarkerImage("http://fish.freeshell.org/style/small_red.png")
                        });
            markers.push(marker);
        }
    });
google.maps.event.addListener(mgr, 'loaded', function() {
    mgr.addMarkers(markers, 1);
    mgr.refresh();
});

});
