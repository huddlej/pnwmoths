<?php
/**
 * Represents a single instance of a similar species.
 */
class PNWMoths_Model_SimilarSpecies extends PNWMoths_Model {
    protected static $designDoc = "moths";
    protected static $viewName = "by_similar_species";

    public static function getData(array $params = array()) {
        $db = parent::getDatabase();

        if ($db === false || array_key_exists("species", $params) === false) {
            return array();
        }

        $species = Zend_Json::encode($params["species"]);
        $viewParams = array("include_docs" => 'true',
                            "key" => $species);

        try {
            $results = $db->getView(self::$designDoc, self::$viewName,
                                    $viewParams);
        }
        catch (Zend_Http_Client_Adapter_Exception $e) {
            // Return no results when the database isn't available.
            return array();
        }

        $similar_species = array();
        foreach ($results->rows as $row) {
            // Get the first key in the array of attachment ids.
            $attachment_id = array_shift(array_keys((array)$row->doc->_attachments));
            // TODO: make URL a property
            $images = array(
                "http://localhost/~huddlej/getFile.php?doc_id={$row->id}&attachment_id={$attachment_id}"
            );
            $similar_species[] = array("species" => $row->doc->similar_species,
                                       "images" => $images);
        }

        return $similar_species;
    }
}
?>