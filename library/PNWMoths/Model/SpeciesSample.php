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

        // Prepare filters to apply when looping through result set.
        if (array_key_exists("filters", $params)) {
            $filters = $params["filters"];
        }
        else {
            $filters = array();
        }

        $samples = array();
        foreach ($results->rows as $row) {
            if (property_exists($row->doc, "state") && $row->doc->state) {
                $row->doc->county = $row->doc->county . " (" . $row->doc->state . ")";
            }

            $row->doc->latitude = (float)$row->doc->latitude;
            $row->doc->longitude = (float)$row->doc->longitude;
            $row->doc->precision = $row->value->precision;
            $row->doc->date = self::getSortableDate($row->doc);
            $samples[] = $row->doc;
        }

        // Sort samples by date so all collection date is in order when it gets
        // displayed in the map info window.
        usort($samples, array("PNWMoths_Model_SpeciesSample", "compareByDate"));

        return $samples;
    }

    public static function getSortableDate($record) {
        if (property_exists($record, "year") && $record->year && property_exists($record, "month") && $record->month && property_exists($record, "day") && $record->day) {
            $date = array($record->year, $record->month, $record->day);
        }
        elseif(property_exists($record, "year") && $record->year && property_exists($record, "month") && $record->month)  {
            $date = array($record->year, $record->month, "1");
        }
        elseif (property_exists($record, "year") && $record->year) {
            $date = array($record->year, "1", "1");
        }
        else {
            $date = array();
        }

        return implode("/", $date);
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
}
?>