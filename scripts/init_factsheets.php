<?php
require_once '../www/bootstrap.php';

//$output_dir = "/home/huddlej/dokuwiki";
$dokuwiki_dir = "/var/www/dokuwiki/data/pages/factsheets";
$output_dir = $dokuwiki_dir;
$template_file = "_template.txt";

// Get a unique list of all species with images in the database.
$species = array();
$couchdb = new Tillikum_CouchDb("http://localhost:5984");
$db = new Tillikum_CouchDb_Database($couchdb, "pnwmoths");

$result = $db->getView("moths", "by_species_image");
foreach ($result->rows as $row) {
    $species[$row->key] = $row->key;
}

print "Found " . count($species) . " species.\n";

if (count($species) > 0) {
    $template = file_get_contents(implode("/", array($dokuwiki_dir, $template_file)));
    $species = array_keys($species);

    // For each species, check whether a factsheet already exists and create one
    // from the template if it doesn't.
    foreach ($species as $s) {
        // For example, change "Autographa ampla" to "autographa_ampla.txt".
        $file = strtolower(str_replace(" ", "_", $s)) . ".txt";
        $full_file = implode("/", array($output_dir, $file));

        // Create the factsheet if it doesn't exist.
        if (file_exists($full_file) == false) {
            $content = str_replace("@!PAGE@", $s, $template);
            file_put_contents($full_file, $content);
            print "Created " . $full_file . "\n";
        }
    }
}
?>