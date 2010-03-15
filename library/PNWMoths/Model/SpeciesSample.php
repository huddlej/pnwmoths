<?php
require_once 'Model.php';

/**
 * Represents a way to obtain a set of moth sample data.
 */
class PNWMoths_Model_MothSample extends PNWMoths_Model {
    protected $designDoc = "moths";
    protected $viewName = "by_species";

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

        $samples = array();
        foreach ($results->rows as $row) {
            $samples[] = $row->doc;
        }

        return $samples;
    }
}
?>