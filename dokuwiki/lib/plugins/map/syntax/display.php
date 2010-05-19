<?php
/**
 * DokuWiki Plugin map (Syntax Component)
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

class syntax_plugin_map_display extends DokuWiki_Syntax_Plugin {

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
        $this->Lexer->addEntryPattern('<map.*?>(?=.*?</map>)',$mode,'plugin_map_display');
    }

    function postConnect() {
        $this->Lexer->addExitPattern('</map>','plugin_map_display');
    }

    function handle($match, $state, $pos, &$handler){
        switch ($state) {
            case DOKU_LEXER_UNMATCHED:
                $data = Zend_Json::decode($match);
                return array($state, $data);
            default:
                return array($state);
        }
    }

    function render($mode, &$renderer, $indata) {
        if($mode != 'xhtml') return false;

        list($state, $data) = $indata;

        switch ($state) {
            case DOKU_LEXER_UNMATCHED:
                $id = $data["id"];
                $data_source = Zend_Json::encode($data["data_source"]);
                $api_key = $this->getConf("google_maps_api_key");
                $renderer->doc .= <<<HTML
<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=$api_key&sensor=false" type="text/javascript"></script>
<script src="http://gmaps-utility-library.googlecode.com/svn/trunk/markermanager/release/src/markermanager.js" type="text/javascript"></script>

<div id="$id" class="googlemap"><span class="data">$data_source</span></div>
HTML;
                break;
            default:
                break;
        }

        return true;
    }
}