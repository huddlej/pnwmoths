<?php
/**
 * DokuWiki Plugin phenology (Syntax Component)
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

class syntax_plugin_phenology_display extends DokuWiki_Syntax_Plugin {

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
        $this->Lexer->addSpecialPattern("{{phenology>[^}]+?}}",$mode,'plugin_phenology_display');
    }

    function handle($match, $state, $pos, &$handler){
        $data = array();
        preg_match('/\{\{phenology>([^}]+?)\}\}/', $match, $matches);

        if (count($matches) > 0) {
            $data["species"] = $matches[1];
        }

        return $data;
    }

    function render($mode, &$renderer, $data) {
        if($mode != 'xhtml') return false;

        if (array_key_exists("species", $data)) {
            $species = $data["species"];
            $api_key = $this->getConf("google_maps_api_key");
            $renderer->doc .= <<<HTML
<div class="yui-u">
<p id="species">$species</p>

<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=$api_key&sensor=false" type="text/javascript"></script>
<script src="http://gmaps-utility-library.googlecode.com/svn/trunk/markermanager/release/src/markermanager.js" type="text/javascript"></script>

<div id="googlemap"></div>
<div id="filters" class="tab" style="display: none;">
    <p class="right"><a href="" id="filters-close"><img src="http://maps.gstatic.com/intl/en_us/mapfiles/iw_close.gif" /></a></p>
    <p><form><input type="button" id="clear-filters" value="Clear filters" /></form></p>
    <p id="filter-elevation">
        Elevation (ft.):
        <form id="form-elevation">
            <input type="text" id="startelevation" size="5" /> -
            <input type="text" id="endelevation" size="5" />
            <input type="submit" value="Filter" /> <input type="button" id="clear-filter-elevation" value="Clear" />
            <br />
            <span class="help">(e.g., 2000 - 10000)</span>
        </form>
    </p>
    <p id="filter-date">
        Date:
        <form id="form-date">
            <input type="text" id="startdate" size="8" title="start date" /> -
            <input type="text" id="enddate" size="8" title="end date" />
            <input type="submit" value="Filter" />
            <input type="button" id="clear-filter-date" value="Clear" />
            <br />
            <span class="help">(e.g., 1/1/1999 - 12/1/2000)</span>
        </form>
    </p>
    <p id="filter-county">
        County:
        <form id="form-county">
            <select id="county" name="county">
                <option>Select a county</option>
            </select>
            <input type="submit" value="Filter" />
            <input type="button" id="clear-filter-county" value="Clear" />
        </form>
    </p>
    <p id="filter-state">
        State:
        <form id="form-state">
            <select id="state" name="state">
                <option>Select a state</option>
            </select>
            <input type="submit" value="Filter" />
            <input type="button" id="clear-filter-state" value="Clear" />
        </form>
    </p>
</div>
<div id="plot" class="tab"></div>
</div>
HTML;
        }
        else {
            $renderer->doc .= "None.";
        }

        return true;
    }
}