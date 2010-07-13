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
        $viewParams = array("reduce" => 'false',
                            "include_docs" => 'true',
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
                $images = array(
                    new PNWMoths_Model_Image("placeholder-image", "moth_45_45.gif")
                );
            }
            $similar_species[] = array("species" => $row->doc->similar_species,
                                       "images" => $images);
        }

        return $similar_species;
    }

    public static function getSpecies(array $params = array()) {
        $db = parent::getDatabase();
        $species = array();

        if ($db !== false) {
            try {
                $viewParams = array("group" => 'true');
                $results = $db->getView(
                    self::$designDoc,
                    self::$viewName,
                    $viewParams
                );
                $species = $results->rows;
            }
            catch (Zend_Http_Client_Adapter_Exception $e) {
                // Return no results when the database isn't available.
            }
        }

        return $species;
    }

    public static function getSimilarSpecies($species) {
        $db = parent::getDatabase();
        $similar_species = array();

        if ($db !== false) {
            try {
                $species = Zend_Json::encode($species);
                $viewParams = array("reduce" => 'false',
                                    "key" => $species,
                                    "include_docs" => 'true');
                $results = $db->getView(
                    self::$designDoc,
                    self::$viewName,
                    $viewParams
                );

                foreach ($results->rows as $row) {
                    $similar_species[$row->doc->_id . " " . $row->doc->_rev] = $row->value;
                }
                asort($similar_species);
            }
            catch (Zend_Http_Client_Adapter_Exception $e) {
                // Return no results when the database isn't available.
            }
        }

        return $similar_species;
    }

    public static function setSimilarSpecies($species, $similar_species) {
        // Get current similar species.
        $current_similar_species = self::getSimilarSpecies($species);
        $updated_docs = array();

        // Add species that are in the given list and aren't in the existing
        // list.
        $new_species = array_diff($similar_species, $current_similar_species);
        if (count($new_species) > 0) {
            foreach ($new_species as $row) {
                $updated_docs[] = new Tillikum_CouchDb_Document(
                    array(
                        "species" => $species,
                        "similar_species" => $row,
                        "type" => "similarspecies"
                    )
                );
            }
        }

        // Remove species that aren't in the given list and are in the existing
        // list.
        $deleted_species = array_diff($current_similar_species, $similar_species);
        if (count($deleted_species) > 0) {
            foreach ($deleted_species as $id_rev => $row) {
                list($id, $rev) = explode(" ", $id_rev);
                $updated_docs[] = new Tillikum_CouchDb_Document(
                    array(
                        "_id" => $id,
                        "_rev" => $rev,
                        "_deleted" => true
                    )
                );
            }
        }

        if(count($updated_docs) > 0) {
            $db = parent::getDatabase();
            $db->saveBulk($updated_docs);
        }
    }
}
?>