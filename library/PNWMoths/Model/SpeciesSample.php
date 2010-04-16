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
            if (array_key_exists("elevation", $filters)) {
                if ($row->doc->elevation < (int)$filters["elevation"][0] ||
                    $row->doc->elevation > (int)$filters["elevation"][1]) {
                    continue;
                }
            }
            if (array_key_exists("date", $filters)) {
                $rowDate = self::getSortableDate($row->doc);

                if ($rowDate < strtotime($filters["date"][0]) ||
                    $rowDate > strtotime($filters["date"][1])) {
                    continue;
                }
            }
            if (array_key_exists("county", $filters)) {
                if ($row->doc->county != $filters["county"]) {
                    continue;
                }
            }
            if (array_key_exists("state", $filters)) {
                if ($row->doc->state != $filters["state"]) {
                    continue;
                }
            }

            $row->doc->latitude = (float)$row->doc->latitude;
            $row->doc->longitude = (float)$row->doc->longitude;
            $row->doc->precision = $row->value->precision;
            $samples[] = $row->doc;
        }

        // Sort samples by date so all collection date is in order when it gets
        // displayed in the map info window.
        usort($samples, array("PNWMoths_Model_SpeciesSample", "compareByDate"));

        return $samples;
    }

    public static function getDate($record) {
        if ($record->year && $record->month && $record->day) {
            return $record->month . "/" . $record->day . "/" . $record->year;
        }
        elseif($record->year && $record->month)  {
            return $record->month . "/" . $record->year;
        }
        elseif ($record->year) {
            return $record->year;
        }
        else {
            return "";
        }
    }

    public static function getSortableDate($record) {
        if ($record->year && $record->month && $record->day) {
            $date = array($record->year, $record->month, $record->day);
        }
        elseif($record->year && $record->month)  {
            $date = array($record->year, $record->month, 1);
        }
        elseif ($record->year) {
            $date = array($record->year, 1, 1);
        }
        else {
            $date = array();
        }

        return strtotime(implode("/", $date));
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