<?php
require_once("CouchSimple.php");

$options = array("host" => "localhost",
                 "port" => 5984);
$couch = new CouchSimple($options);

$key = urlencode($_GET["key"]);
//$key = urlencode("Abrostola urentis");
//$key = urlencode("Autographa californica");

$query = "/pnwmoths/_design/moths/_view/by_species/?key=$key";

$resp = $couch->send("GET", $query);
header("Content-length: " . strlen($resp));
print $resp;
?>
