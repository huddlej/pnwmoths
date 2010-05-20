<?php
/**
 * DokuWiki Plugin chart (Syntax Component)
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

class syntax_plugin_chart_display extends DokuWiki_Syntax_Plugin {

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
        $this->Lexer->addEntryPattern('<chart.*?>(?=.*?</chart>)',$mode,'plugin_chart_display');
    }

    function postConnect() {
        $this->Lexer->addExitPattern('</chart>','plugin_chart_display');
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
                $data_source = $data["data_source"];

                // Any chart options should be output as JSON for use by the
                // chart javascript.
                if (array_key_exists("options", $data)) {
                    $options = Zend_Json::encode($data["options"]);
                }
                else {
                    $options = "";
                }

                $renderer->doc .= <<<HTML
<div id="$id" class="chart tab">
    <span class="data">$data_source</span>
    <span class="options">$options</span>
</div>
HTML;
                break;
            default:
                break;
        }

        return true;
    }
}