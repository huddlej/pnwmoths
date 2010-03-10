<?php
/**
 * DokuWiki Plugin similarspecies (Syntax Component)
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
require_once 'SimilarSpecies.php';

class syntax_plugin_similarspecies_display extends DokuWiki_Syntax_Plugin {

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
        $this->Lexer->addSpecialPattern("{{similarspecies>[^}]+?}}",$mode,'plugin_similarspecies_display');
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        preg_match('/\{\{similarspecies>([^}]+?)\}\}/', $match, $matches);

        if (count($matches) > 0) {
            $data["species"] = $matches[1];

            $model = new PNWMoths_Data_SimilarSpecies();
            $data["data"] = $model->getData(array("species" => $data["species"]));
        }

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        if (count($data["data"]) > 0) {
            foreach($data["data"] as $row) {
                $renderer->doc .= "<p>";
                $renderer->internalLink($row["species"], $row["species"]);
                $renderer->doc .= "</p>";

                if (count($row["images"]) > 0) {
                    $renderer->doc .= "<ul class='similar-species jcarousel-skin-tango'>";
                    foreach($row["images"] as $image_url) {
                        $renderer->doc .= "<li><img src='$image_url' /></li>";
                    }
                    $renderer->doc .= "</ul>";
                }
            }
        }
        else {
            $renderer->doc .= "None.";
        }

        return true;
    }
}