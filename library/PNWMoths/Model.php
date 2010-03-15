<?php
/**
 * Setup include paths and Zend autoloader so all required modules will be
 * loaded automatically.
 */
set_include_path("/usr/share/php/libzend-framework-php" . PATH_SEPARATOR . "/home/huddlej/src/tillikum-couchdb/library" . PATH_SEPARATOR . get_include_path());
require_once 'Zend/Loader/Autoloader.php';
$loader = Zend_Loader_Autoloader::getInstance();
$loader->registerNamespace('Tillikum_');

class PNWMoths_Model {
    public function getDatabase() {
        try {
            $couchdb = new Tillikum_CouchDb("http://localhost:5984");
            $db = new Tillikum_CouchDb_Database($couchdb, "pnwmoths");
            return $db;
        }
        catch (Exception $e) {
            return false;
        }
    }

    public function getData(array $params = array()) {
        throw new Exception("Not defined.");
    }
}
?>