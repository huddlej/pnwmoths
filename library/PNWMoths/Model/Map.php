<?php
class PNWMoths_Model_Map extends PNWMoths_Model {
    public static function getData(array $params = array()) {
        $db = $this->getDatabase();

        /**
         * Fetch species data. A species key is optional.
         */
        $viewParams = array();
        if (array_key_exists("species", $params)) {
            $viewParams["key"] = Zend_Json::encode($params["species"]);
        }
        $data = $db->getView("moths", "by_species", $viewParams);

        /**
         * Encode species data as JSON for use by javascript.
         */
        $response = Zend_Json::encode($data);
        return $response;
    }
}
?>