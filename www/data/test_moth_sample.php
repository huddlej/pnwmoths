<?php
require_once 'MothSample.php';
require_once 'GoogChart.class.php';

if (array_key_exists("species", $_GET)) {
    $species = $_GET["species"];
}

$model = new PNWMoths_Data_MothSample();

if (isset($species)) {
    $data = $model->getData(array("species" => $species));

    $sampleByMonth = array();
    foreach($data as $row) {
        if (property_exists($row, "month")) {
            $month = (int)$row->month;

            if (array_key_exists($month, $sampleByMonth) === false) {
                $sampleByMonth[$month] = 0;
            }

            $sampleByMonth[$month] += 1;
        }
    }

    ksort($sampleByMonth);
    print "<pre>";
    print_r($sampleByMonth);
    print "</pre>";

    // Set graph colors
    $color = array('#99C754',
                   '#54C7C5',
                   '#999999');

    $chart = new GoogChart();
    $chart->setChartAttrs( array('type' => 'bar-vertical',
                                 'title' => "$species Phenology",
                                 'data' => $sampleByMonth,
                                 'size' => array( 550, 200 ),
                                 'color' => $color,
                                 'labelsXY' => true));
    echo $chart;
}

//if (array_key_exists("debug", $_GET)) {
//     if (isset($data)) {
//         if (isset($data)) {
//             print "<pre>";
//             print_r($data);
//             print "</pre>";
//         }
//     }
//}
?>