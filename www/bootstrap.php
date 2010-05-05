<?php
/**
 * Setup include paths and Zend autoloader so all required modules will be
 * loaded automatically.
 */
$paths = array(
    "/usr/local/share/ZendFramework/library",
    "/usr/share/php/libzend-framework-php",
    "/home/huddlej/src/tillikum-couchdb/library",
    "/home/huddlej/pnwmoths/library",
    get_include_path()
);

set_include_path(implode(PATH_SEPARATOR, $paths));

require_once 'Zend/Loader/Autoloader.php';
$loader = Zend_Loader_Autoloader::getInstance();
$loader->registerNamespace('Tillikum_');
$loader->registerNamespace('PNWMoths_');
?>