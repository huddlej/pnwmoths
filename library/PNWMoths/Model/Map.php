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
                        "Collections" => array()
                    )
                );
            }

            $points[$point]["info"]["Collections"][] = PNWMoths_Model_SpeciesSample::getCollection($sample);
        }

        foreach ($points as $point_index => $point) {
            $view = new Zend_View();
            $view->setScriptPath("/home/huddlej/pnwmoths/library/PNWMoths/Model/scripts");
            $view->species = $species;
            $point["info"]["Collections"] = implode("<br />", $point["info"]["Collections"]);
            $view->info = $point["info"];
            $points[$point_index]["info"] = $view->render("info_window.phtml");
        }

        return array_values($points);
    }
}
?>