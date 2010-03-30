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

            if (array_key_exists($point, $points)) {
            }
            else {
                $points[$point] = array(
                    "lat" => (float)$sample->latitude,
                    "lng" => (float)$sample->longitude,
                    "info" => array(
                        "site_name" => $sample->site_name,
                        "county" => $sample->county,
                        "state" => $sample->state,
                        "elevation" => $sample->elevation
                    )
                );
            }
        }

        foreach ($points as $point_index => $point) {
            $html = "<h2>$species</h2>";
            $html .= "<table>";
            foreach ($point["info"] as $key => $value) {
                if ($value === null) {
                    $clean_value = "";
                }
                else {
                    $clean_value = $value;
                }
                $html .= "<tr>";
                $html .= "<td>$key</td>";
                $html .= "<td>$clean_value</td>";
                $html .= "</tr>";
            }
            $html .= "</table>";
            $points[$point_index]["info"] = $html;
        }

        return array_values($points);
    }
}
?>