<?php
/**
 * Setup include paths and Zend autoloader so all required modules will be
 * loaded automatically.
 */
set_include_path("/usr/share/php/libzend-framework-php" . PATH_SEPARATOR . "/home/huddlej/src/svn.tillikum.org/trunk/www/library" . PATH_SEPARATOR . get_include_path());
require_once 'Zend/Loader/Autoloader.php';
$loader = Zend_Loader_Autoloader::getInstance();
$loader->registerNamespace('Tillikum_');

/**
 * Connect to the database.
 */
$couchdb = new Tillikum_CouchDb("http://localhost:5984");
$db = new Tillikum_CouchDb_Database($couchdb, "pnwmoths");

/**
 * Fetch species data. A species key is optional.
 */
$viewParams = array();
if (array_key_exists("species", $_GET)) {
    $viewParams["key"] = Zend_Json::encode($_GET["species"]);
}
$data = $db->getView("moths", "by_species", $viewParams);

/**
 * Encode species data as JSON for use by javascript.
 */
$response = Zend_Json::encode($data);
print $response;
?>