<?php
require_once 'SimilarSpecies.php';

if (array_key_exists("species", $_GET)) {
    $species = $_GET["species"];
}

$model = new PNWMoths_Data_SimilarSpecies();
$all_species = $model->getAll();

// foreach($all_species as $s) {
//     if ($s->key != $species) {
//         print "<a href='?class=SimilarSpecies&species=".$s->key."'>" . $s->key . "</a><br />";
//     }
// }

if (isset($species)) {
    $data = $model->getData(array("species" => $species));

    print "<h2>Species similar to $species</h2>";
    foreach($data as $row) {
        foreach($row->doc->similar_species as $similar_species) {
            print "<p>{$similar_species->species}</p>";
            if (isset($similar_species->images)) {
                print "<ul>";
                foreach($similar_species->images as $image_id) {
                    print "<li><img src='getFile.php?doc_id=".$row->id."&attachment_id=".$image_id."' /></li>";
                }
                print "</ul>";
            }
        }
    }
}

// if (isset($data)) {
//     if (isset($data)) {
//         print "<pre>";
//         print_r($data);
//         print "</pre>";
//     }
// }
?>