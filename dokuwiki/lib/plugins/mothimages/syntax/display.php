<?php
/**
 * DokuWiki Plugin mothimages (Syntax Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  John Huddleston <huddlej@gmail.com>
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

if (!defined('DOKU_LF')) define('DOKU_LF', "\n");
if (!defined('DOKU_TAB')) define('DOKU_TAB', "\t");
if (!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');

require_once(DOKU_PLUGIN.'syntax.php');
require_once 'bootstrap.php';

class syntax_plugin_mothimages_display extends DokuWiki_Syntax_Plugin {

    function getInfo() {
        return confToHash(dirname(__FILE__).'/../plugin.info.txt');
    }

    function getType() {
        return 'substition';
    }

    function getPType() {
        return 'block';
    }

    function getSort() {
        return 305;
    }

    function connectTo($mode) {
        $this->Lexer->addSpecialPattern("{{mothimages>[^}]+?}}",$mode,'plugin_mothimages_display');
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        preg_match('/\{\{mothimages>([^}]+?)\}\}/', $match, $matches);

        if (count($matches) > 0) {
            $data["species"] = $matches[1];

            $model = new PNWMoths_Model_Image();
            $data["data"] = $model->getData(array("species" => $data["species"]));
        }

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        if (count($data["data"]) > 0) {
            $firstRow = true;
            $renderer->doc .= "<div id='images'>";
            foreach($data["data"] as $row) {
                $image_url = $row["image"];

                if ($firstRow) {
                    $renderer->doc .= "<div id='current-image'><img src='$image_url' /></div>";
                    $renderer->doc .= "<ul id='other-images' class='jcarousel-skin-tango'>";
                    $firstRow = false;
                }

                if (property_exists($row["data"], "caption")) {
                    $renderer->doc .= "<li><img src='$image_url' title='{$row["data"]->caption}' /></li>";
                }
                else {
                    $renderer->doc .= "<li><img src='$image_url' /></li>";
                }
            }
            $renderer->doc .= "</ul>";
            $renderer->doc .= "</div>";
        }
        else {
            $renderer->doc .= "None.";
        }

        return true;
    }
}