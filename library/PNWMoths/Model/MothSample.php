<?php
require_once 'Data.php';

/**
 * Represents a way to obtain a set of moth sample data.
 */
class PNWMoths_Data_MothSample extends PNWMoths_Data {
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