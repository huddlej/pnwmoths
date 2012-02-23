jQuery(window).load(function() {
	jQuery('.blueberry').blueberry({interval: 8000, pager: false});

    if (typeof(GBrowserIsCompatible) == "undefined" || !GBrowserIsCompatible()) {
        jQuery("#googlemap").html("<p>Sorry, your browser is not compatible with the current version of Google Maps.</p><p>For more information, visit <a href='http://local.google.com/support/bin/answer.py?answer=16532&topic=1499'>Google's browser support page</a>.</p>");
        return;
    }    

    // A lot of copy/paste here
    // This is a test implementation to see how Google Maps V2 handles ALL of our data points
    // on the homepage.
    jQuery("#googlemap").show();
    var map = new GMap2(jQuery("#googlemap").get(0));
    map.setCenter(new GLatLng(46.90, -118.00), 5);
    
    map.addControl(new GSmallMapControl());
    map.addControl(new GMapTypeControl());
    map.addMapType(G_PHYSICAL_MAP);
    map.removeMapType(G_NORMAL_MAP);
    map.removeMapType(G_SATELLITE_MAP);
    map.setMapType(G_PHYSICAL_MAP);

    var polygon = new GPolygon([
                    new GLatLng(40, -111.0),
                    new GLatLng(52.3, -111.0),
                    new GLatLng(52.3, -130),
                    new GLatLng(40, -126),
                    new GLatLng(40, -111.0)
                  ], "#000000", 2, 1, "#ffffff", 0);
    map.addOverlay(polygon);

    var mgr = new MarkerManager(map);
    
    // Define Marker Style
    imagePath = "http://localhost/media/images/markers/";
    var icon = new GIcon();
    icon.iconSize = new GSize(6, 6);
    icon.shadowSize = new GSize(9, 6);
    icon.iconAnchor = new GPoint(3, 6);
    icon.infoWindowAnchor = new GPoint(3, 0);
    icon.image = imagePath + "cccccc" + "/image.png";
    icon.printImage = imagePath + "cccccc" + "/printImage.gif";
    icon.mozPrintImage = imagePath + "cccccc" + "/mozPrintImage.gif";
    icon.shadow = imagePath + "cccccc" + "/shadow.png";
    icon.transparent = imagePath + "cccccc" + "/transparent.png";
    icon.printShadow = imagePath + "cccccc" + "/printShadow.gif";

    // Place Markers
    var markers = []
    jQuery.each(PNWMOTHS.Data.data['all-coords'], function(index, coords) {
        if (coords['latitude'] && coords['latitude']) {
            markers.push(new GMarker(new GLatLng(coords['latitude'], coords['longitude']), icon));
        }
    });

    mgr.addMarkers(markers, map.getCurrentMapType().getMinimumResolution(), map.getCurrentMapType().getMaximumResolution());
    mgr.refresh();

    map.setCenter(new GLatLng(46.90, -118.00), map.getBoundsZoomLevel(polygon.getBounds()));
});
