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

function getMap($species) {
    return PNWMoths_Model_Map::getData(
        array("species" => $species)
    );
}

if (array_key_exists("method", $_GET) && array_key_exists("species", $_GET)) {
    $species = $_GET["species"];

    switch ($_GET["method"]) {
        case 'getPhenology':
            $data = getPhenology($species);
            break;
        case 'getMap':
            $data = getMap($species);
            break;
        case 'getSamples':
            $data = getSamples($species);
            break;
        default:
            break;
    }

    if (isset($data)) {
        header("Content-type: text/plain");
        echo Zend_Json::encode($data);
    }
}
?>