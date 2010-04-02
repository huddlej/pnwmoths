<?php
class PNWMoths_Model_Map extends PNWMoths_Model {
    public static function getData(array $params = array()) {
        if (array_key_exists("species", $params) === false) {
            return array();
        }

        $species = $params["species"];
        $samples = PNWMoths_Model_SpeciesSample::getData(
            array("species" => $species)
        );

        // Sort samples by date so all collection date is in order when it gets
        // displayed in the map info window.
        usort($samples, array("PNWMoths_Model_SpeciesSample", "compareByDate"));

        // Create a unique list of points indexed by latitude|longitude.
        $points = array();
        foreach ($samples as $sample) {
            $point = implode("|", array($sample->latitude, $sample->longitude));

            if (array_key_exists($point, $points) === false) {
                $points[$point] = array(
                    "lat" => (float)$sample->latitude,
                    "lng" => (float)$sample->longitude,
                    "info" => array(
                        "Site name" => $sample->site_name,
                        "County" => $sample->county,
                        "State" => $sample->state,
                        "Elevation" => $sample->elevation,
                    ),
                    "collections" => array()
                );
            }

            // Get a string representation of this sample's collection data.
            $collection = PNWMoths_Model_SpeciesSample::getCollection($sample);
            if ($collection) {
                $points[$point]["collections"][] = $collection;
            }
        }

        foreach ($points as $point_index => $point) {
            $view = new Zend_View();
            $view->setScriptPath("/home/huddlej/pnwmoths/library/PNWMoths/Model/scripts");
            $view->species = $species;
            $view->info = $point["info"];
            $view->collections = $point["collections"];
            unset($points[$point_index]["collections"]);
            $points[$point_index]["info"] = $view->render("info_window.phtml");
        }

        return array_values($points);
    }
}
?>