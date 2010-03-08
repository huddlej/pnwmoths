<?php
require_once 'SimilarSpecies.php';

if (array_key_exists("species", $_GET)) {
    $species = $_GET["species"];
}

$model = new PNWMoths_Data_SimilarSpecies();

if (isset($species)) {
    $data = $model->getData(array("species" => $species));

    print "<h2>Species similar to $species</h2>";
    foreach($data as $row) {
        print "<p>{$row["species"]}</p>";
        print "<ul>";
        foreach($row["images"] as $image_url) {
            print "<li><img src='$image_url' /></li>";
        }
        print "</ul>";
    }
}

if (array_key_exists("debug", $_GET)) {
    if (isset($data)) {
        if (isset($data)) {
            print "<pre>";
            print_r($data);
            print "</pre>";
        }
    }
}
?>