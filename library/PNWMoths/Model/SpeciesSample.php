<?php
/**
 * Represents a way to obtain a set of moth sample data.
 */
class PNWMoths_Model_SpeciesSample extends PNWMoths_Model {
    protected static $designDoc = "moths";
    protected static $viewName = "by_species";

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

        $samples = array();
        foreach ($results->rows as $row) {
            $samples[] = $row->doc;
        }

        return $samples;
    }

    public static function getDate($record) {
        return implode("/", array($record->month,
                                  $record->day,
                                  $record->year));
    }

    /**
     * Compare two species samples by date. Used to sort an array of samples by
     * date.
     */
    public static function compareByDate($a, $b) {
        $a = array($a->year, $a->month, $a->day);
        $b = array($b->year, $b->month, $b->day);

        if ($a == $b) {
            return 0;
        }
        else {
            return ($a < $b) ? -1 : 1;
        }
    }

    public static function getCollection($record) {
        $summary = self::getDate($record);

        if ($record->collector) {
            $summary .= " by " . $record->collector;

            if ($record->number_of_males) {
                $summary .= ", " . $record->number_of_males . " males";
            }

            if ($record->number_of_females) {
                $summary .= ", " . $record->number_of_females . " females";
            }

            if ($record->collection) {
                $summary .= " (" . $record->collection . ")";
            }
        }

        return $summary;
    }
}
?>