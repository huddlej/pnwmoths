<?php
require_once '../bootstrap.php';

$data = new PNWMoths_Model();
$db = $data->getDatabase();

if (array_key_exists("id", $_GET) && stripos($_GET["id"], "/") !== false) {
    // File ids are formatted as "doc_id/attachment_id".
    list($doc_id, $attachment_id) = explode("/", $_GET["id"]);
    $attachment = $db->getAttachment($doc_id, $attachment_id);
    if ($attachment->getStatus() == 200) {
        $headers = explode("\n", $attachment->getHeadersAsString());
        foreach ($headers as $header) {
            header($header);
        }
        header('Content-Disposition: inline; filename="' . $attachment_id .'"');

        print $attachment->getBody();
    }
}
?>