jQuery(document).ready(function($) {
    $("#featured").tabs({fx:{opacity: "toggle"}}).tabs("rotate", 5000, true).tabs("select", 0);
});

jQuery(window).load(function() {
    // Initialize our map
    var mapDiv = jQuery("#googlemap");
    mapDiv.show();
    var centerPoint = new google.maps.LatLng(46.2, -119.4);
    var zoomLevel = 5;
    if (jQuery(window).width() < 500)
        zoomLevel = 4;
    var options = {
                zoom: 5,
                scrollwheel: false,
                zoomControl: false,
                scaleControl: false,
                streetViewControl: false,
                maxZoom: zoomLevel,
                minZoom: zoomLevel,
                center: centerPoint,
                panControlOptions: {
                    position: google.maps.ControlPosition.LEFT_BOTTOM
                },
                mapTypeId: 'terrain'
    };  
    var map = new google.maps.Map(mapDiv[0], options);

    // Create our polygon boundaries with hole
    var everythingElse = [
                new google.maps.LatLng(-87, 120),
                new google.maps.LatLng(-87, -87),
                new google.maps.LatLng(-87, 0)];
    var pnw = [
              new google.maps.LatLng(39, -126),
              new google.maps.LatLng(52.3, -130),
              new google.maps.LatLng(52.3, -109.0),
              new google.maps.LatLng(39, -109.0)];
    var polygon = new google.maps.Polygon({
              paths: [everythingElse, pnw],
              strokeColor: "#333",
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: "#000000",
              fillOpacity: .1,
              clickable: false
            });
    polygon.setMap(map);

    // Show all coords from fusion table (needs to be updated on occasion)
    var allcoords = new google.maps.FusionTablesLayer({
      query: {
        select: 'location',
        from: '1jYnlxb74q0gOMuAU6ZCFLlAIAfgPy4GCYT2qiBo'
      },
      clickable: false
    });
    allcoords.setMap(map);
});
