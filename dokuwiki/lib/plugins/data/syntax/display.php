<?php
/**
 * DokuWiki Plugin data (Syntax Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  John Huddleston <huddlej@gmail.com>
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

if (!defined('DOKU_LF')) define('DOKU_LF', "\n");
if (!defined('DOKU_TAB')) define('DOKU_TAB', "\t");
if (!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');

require_once DOKU_PLUGIN.'syntax.php';

class syntax_plugin_data_display extends DokuWiki_Syntax_Plugin {
    function getType() {
        return 'substition';
    }

    function getPType() {
        return 'block';
    }

    function getSort() {
        return 307;
    }


    function connectTo($mode) {
        // Use a lookahead pattern to make sure there is a closing tag before
        // activating this plugin. The values preceded by forward slashes are
        // equivalent to "<" and ">" characters.
        $this->Lexer->addEntryPattern(
            '<data>(?=.*\x3C/data\x3E)',
            $mode,
            'plugin_data_display'
        );
    }

    function postConnect() {
        $this->Lexer->addExitPattern('</data>','plugin_data_display');
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        $renderer->doc = "<p>DATA</p>";

        return true;
    }
}

// vim:ts=4:sw=4:et:enc=utf-8:
