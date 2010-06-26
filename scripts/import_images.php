<?php
require_once '../www/bootstrap.php';

// By default existing documents aren't updated.
$update_docs = false;
if (count($argv) > 1 && $argv[1] == "update_docs") {
    $update_docs = true;
}

$image_dir = "/home/huddlej/Desktop/moths";
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
$images_saved = 0;

foreach ($files as $file) {
    // Get species name from the file name.
    list($species, $rest) = explode("-", $file);

    try {
        // Look for an existing document with the same id to update.
        $image_doc = $db->getDocument($file);

        if ($update_docs) {
            $revision = $image_doc->_rev;
            $updated = true;
        }
        else {
            continue;
        }
    }
    catch (Tillikum_CouchDb_Exception $e) {
        // Create a new image document based on the image document template and the
        // species name. The document id is the file name.
        $image_doc = new Tillikum_CouchDb_Document(
            array_merge(
                $image_doc_template,
                array(
                    "_id" => $file,
                    "species" => $species
                )
            )
        );
        $response = $db->saveDocument($image_doc);
        $revision = $response->rev;
        $updated = false;
    }

    // Attach image file.
    try {
         // Add image content to image document.
        $body = file_get_contents(implode("/", array($image_dir, $file)));
        $attachment_response = $db->saveAttachment(
            $image_doc->_id,
            $file,
            $body,
            array("rev" => $revision),
            $headers
        );

        // Save the date the document was modified after the image is
        // successfully attached.
        $image_doc = $db->getDocument($file);
        $image_doc->date_modified = date("c");
        $db->saveDocument($image_doc);
        $images_saved++;

        if ($updated) {
            print "Updated image '{$attachment_response->id}'\n";
        }
        else {
            print "Added image '{$attachment_response->id}'\n";
        }
    }
    catch (Tillikum_CouchDb_Exception $e) {
        print "Skipped image '$file': " . print_r($e) . "\n";
    }
}

print "Found " . count($files) . " images.\n";
print "Saved $images_saved images.\n";
?>