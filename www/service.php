<?php
require_once 'bootstrap.php';

function getSamples($species) {
    return PNWMoths_Model_SpeciesSample::getData(
        array("species" => $species)
    );
}

function getPhenology($species) {
    $phenology = PNWMoths_Model_Phenology::getData(
        array("species" => $species)
    );
    return array_values($phenology);
}

if (array_key_exists("method", $_GET) && array_key_exists("species", $_GET)) {
    $species = $_GET["species"];

    switch ($_GET["method"]) {
        case 'getPhenology':
            $data = getPhenology($species);
            break;
        case 'getSamples':
            $data = getSamples($species);
            break;
        default:
            break;
    }

    if (isset($data)) {
        echo Zend_Json::encode($data);
    }
}
?>