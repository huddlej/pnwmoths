<?php
require_once 'bootstrap.php';

function getCounties() {
    return PNWMoths_Model_County::getData();
}

function getSamples($species, $options) {
    $sampleOptions = array(
        "filters" => array(),
        "species" => $species
    );
    $allowedFilters = array("elevation", "date");

    foreach ($allowedFilters as $allowedFilter) {
        if (array_key_exists($allowedFilter, $options)) {
            $value = $options[$allowedFilter];
            if ($value != "") {
                $sampleOptions["filters"][$allowedFilter] = $value;
            }
        }
    }

    return PNWMoths_Model_SpeciesSample::getData($sampleOptions);
}

if (array_key_exists("method", $_GET)) {
    $method = $_GET["method"];
    unset($_GET["method"]);

    if (array_key_exists("species", $_GET)) {
        $species = $_GET["species"];
        unset($_GET["species"]);
    }

    $options = $_GET;

    switch ($method) {
        case 'getSamples':
            if (isset($species)) {
                $data = getSamples($species, $options);
            }
            break;
        case 'getCounties':
            $data = getCounties();
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