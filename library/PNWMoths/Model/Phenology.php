<?php
class PNWMoths_Model_Phenology extends PNWMoths_Model {
    public function getData(array $params = array()) {
        if (array_key_exists("species", $params) === false) {
            return array();
        }

        $species = $params["species"];
        $samplesModel = new PNWMoths_Model_SpeciesSample();
        $samples = $samplesModel->getData(array("species" => $species));

        $samplesByInterval = array();

        /**
         * Pre-populate samples by interval with zeroes.
         */
        $startInterval = 1;
        $endInterval = 12;
        $samplesByInterval = array_fill($startInterval, $endInterval, 0);

        /**
         * Map sample data to the given interval by counting each sample that
         * matches an interval marker.
         */
        foreach ($samples as $sample) {
            if ($sample->month) {
                $samplesByInterval[(int)$sample->month] += 1;
            }
        }

        return $samplesByInterval;
    }
}
?>