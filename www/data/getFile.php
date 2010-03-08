<?php
require_once 'Data.php';

$data = new PNWMoths_Data();
$db = $data->getDatabase();

if (array_key_exists("doc_id", $_GET)) {
    $doc_id = $_GET["doc_id"];

    if (array_key_exists("attachment_id", $_GET)) {
        $attachment_id = $_GET["attachment_id"];        
        $attachment = $db->getAttachment($doc_id, $attachment_id);
        header('Content-Type', $attachment->getHeader('Content-Type'));
        header('Content-Length', $attachment->getHeader('Content-Length'));
        echo $attachment->getBody();
    }
}
?>