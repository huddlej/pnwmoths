<?php
/**
 * Represents a single instance of a similar species.
 */
class PNWMoths_Model_Image extends PNWMoths_Model {
    protected $designDoc = "moths";
    protected $viewName = "by_species_image";

    public function getData(array $params = array()) {
        $db = $this->getDatabase();

        if ($db === false || array_key_exists("species", $params) === false) {
            return array();
        }

        $species = Zend_Json::encode($params["species"]);
        $viewParams = array("include_docs" => 'true',
                            "key" => $species);

        try {
            $results = $db->getView($this->designDoc, $this->viewName,
                                    $viewParams);
        }
        catch (Zend_Http_Client_Adapter_Exception $e) {
            // Return no results when the database isn't available.
            return array();
        }

        $images = array();
        foreach ($results->rows as $row) {
            // Get the last value in the array of attachment ids.
            $attachment_id = array_pop(array_keys((array)$row->doc->_attachments));
            $images[] = array("data" => $row->doc,
                              "image" => "http://localhost/~huddlej/getFile.php?doc_id={$row->id}&attachment_id={$attachment_id}");
        }

        return $images;
    }
}
?>