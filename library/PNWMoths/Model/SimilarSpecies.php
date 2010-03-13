<?php
require_once 'Model.php';

/**
 * Represents a single instance of a similar species.
 */
class PNWMoths_Model_SimilarSpecies extends PNWMoths_Model {
    protected $designDoc = "moths";
    protected $viewName = "by_similar_species";

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

        $similar_species = array();
        foreach ($results->rows as $row) {
            $images = array();
            foreach ($row->doc->_attachments as $attachment_id => $attachment) {
                // TODO: make URL a property
                $images[] = "http://localhost/~huddlej/getFile.php?doc_id={$row->id}&attachment_id={$attachment_id}";
            }
            $similar_species[] = array("species" => $row->doc->similar_species,
                                       "images" => $images);
        }

        return $similar_species;
    }
}
?>