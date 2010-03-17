<?php
require_once 'bootstrap.php';

function getSamples($species) {
    $model = new PNWMoths_Model_SpeciesSample();
    $samples = $model->getData(array("species" => $species));
    return $samples;
}

function getPhenology($species) {
    $model = new PNWMoths_Model_Phenology();
    $phenology = $model->getData(array("species" => $species));
    return $phenology;
}

$server = new Zend_Rest_Server();
$server->addFunction('getSamples');
$server->addFunction('getPhenology');
$server->handle();
?>