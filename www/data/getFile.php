<?php
set_include_path("/usr/share/php/libzend-framework-php" . PATH_SEPARATOR . "/home/huddlej/src/svn.tillikum.org/trunk/www/library" . PATH_SEPARATOR . get_include_path());
require_once 'Zend/Loader/Autoloader.php';
$loader = Zend_Loader_Autoloader::getInstance();
$loader->registerNamespace('Tillikum_');

$couchdb = new Tillikum_CouchDb("http://localhost:5984");
$db = new Tillikum_CouchDb_Database($couchdb, "pnwmoths");

if (array_key_exists("doc_id", $_GET)) {
    $doc_id = $_GET["doc_id"];

    if (array_key_exists("attachment_id", $_GET)) {
        $attachment_id = $_GET["attachment_id"];        
        $attachment = $db->getAttachment($doc_id, $attachment_id);
        header('Content-Type', $attachment->getHeader('Content-Type'));
        header('Content-Length', $attachment->getHeader('Content-Length'));
        echo $attachment->getBody();
    }
}
?>