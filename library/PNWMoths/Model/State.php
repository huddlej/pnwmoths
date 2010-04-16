<?php
/**
 * Represents a way to obtain all counties in the database.
 */
class PNWMoths_Model_State extends PNWMoths_Model {
    protected static $designDoc = "moths";
    protected static $viewName = "states";

    public static function getData(array $params = array()) {
        $db = parent::getDatabase();

        if ($db === false) {
            return array();
        }

        $viewParams = array("group" => 'true');

        try {
            $results = $db->getView(self::$designDoc, self::$viewName,
                                    $viewParams);
        }
        catch (Zend_Http_Client_Adapter_Exception $e) {
            // Return no results when the database isn't available.
            return array();
        }

        $states = array();
        foreach ($results->rows as $row) {
            $states[] = $row->key;
        }

        return $states;
    }
}
?>