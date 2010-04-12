<?php
require_once 'bootstrap.php';

$data = new PNWMoths_Model();
$db = $data->getDatabase();

if (array_key_exists("doc_id", $_GET)) {
    $doc_id = $_GET["doc_id"];

    if (array_key_exists("attachment_id", $_GET)) {
        $attachment_id = $_GET["attachment_id"];        
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
}
?>