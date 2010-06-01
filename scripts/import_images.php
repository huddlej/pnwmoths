<?php
require_once '../www/bootstrap.php';

$image_dir = "/home/huddlej/Desktop/moth-images-processed/test";
$image_doc_template = array(
    "type" => "image",
    "author" => "John Huddleston",
    "source" => "WWU"
);
$headers = array(
    "Content-Type" => "image/jpeg"
);

$couchdb = new Tillikum_CouchDb("http://localhost:5984");
$db_name = "pnwmoths";
$db = new Tillikum_CouchDb_Database($couchdb, $db_name);

// Get all files after the current and parent directories (i.e., "." and "..").
$files = array_slice(scandir($image_dir), 2);
foreach ($files as $file) {
    // Get species name from the file name.
    list($species, $rest) = explode("-", $file);

    // Create a new image document based on the image document template and the
    // species name. The document id is the file name.
    $image_doc = new Tillikum_CouchDb_Document(
        array_merge(
            $image_doc_template,
            array("_id" => $file,
                  "species" => $species)
        )
    );

    // Save image document.
    try {
        $response = $db->saveDocument($image_doc);

        // Add image content to image document.
        $body = file_get_contents(implode("/", array($image_dir, $file)));
        $attachment_response = $db->saveAttachment(
            $response->id,
            $file,
            $body,
            array("rev" => $response->rev),
            $headers
        );

        print "Added image '{$attachment_response->id}'\n";
    }
    catch (Tillikum_CouchDb_Exception $e) {
        print "Skipped existing image '$file'\n";
    }
}
?>