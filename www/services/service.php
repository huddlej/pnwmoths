<?php
require_once '../bootstrap.php';

if (array_key_exists("method", $_GET)) {
    $method = $_GET["method"];
    unset($_GET["method"]);

    if (array_key_exists("species", $_GET)) {
        $species = $_GET["species"];
        unset($_GET["species"]);
    }

    $options = $_GET;

    switch ($method) {
        default:
            break;
    }

    if (isset($data)) {
        header("Content-type: text/plain");
        echo Zend_Json::encode($data);
    }
}
?>