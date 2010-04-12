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
            if ($row->doc->image) {
                list($doc_id, $attachment_id) = (array)$row->doc->image;
                $images = array(
                    new PNWMoths_Model_Image($doc_id, $attachment_id)
                );
            }
            else {
                $images = array("<img src='http://www.sheppardsoftware.com/content/animals/images/invertebrates/moth_45_45.gif' />");
            }
            $similar_species[] = array("species" => $row->doc->similar_species,
                                       "images" => $images);
        }

        return $similar_species;
    }
}
?>