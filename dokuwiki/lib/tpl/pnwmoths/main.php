<?php
/**
 * DokuWiki Default Template
 *
 * This is the template you need to change for the overall look
 * of DokuWiki.
 *
 * You should leave the doctype at the very top - It should
 * always be the very first line of a document.
 *
 * @link   http://dokuwiki.org/templates
 * @author Andreas Gohr <andi@splitbrain.org>
 */

// must be run from within DokuWiki
if (!defined('DOKU_INC')) die();

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?php echo $conf['lang']?>"
 lang="<?php echo $conf['lang']?>" dir="<?php echo $lang['direction']?>">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>
    <?php tpl_pagetitle()?> | <?php echo strip_tags($conf['title'])?>
  </title>

  <link rel="stylesheet" href="http://yui.yahooapis.com/2.7.0/build/reset-fonts-grids/reset-fonts-grids.css" type="text/css">

  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"
          type="text/javascript"></script>
  <?php
  if (strpos($ID, "factsheets:") !== false) {
    ?>
    <script src="http://sorgalla.com/projects/jcarousel/lib/jquery.jcarousel.pack.js"
            type="text/javascript"></script>
    <script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAA_cr19ifAS821S0ocdvCL1BT2yXp_ZAY8_ufC3CFXhHIE1NvwkxSzkSklZUfvCZ2DkVLa3pDPglmbAQ&sensor=true_or_false"
            type="text/javascript"></script>
    <script src="http://gmaps-utility-library.googlecode.com/svn/trunk/markermanager/release/src/markermanager.js" type="text/javascript"></script>

    <script language="javascript" type="text/javascript" src="/~huddlej/js/jquery.jqplot.min.js"></script>
    <script language="javascript" type="text/javascript" src="/~huddlej/js/jqplot.barRenderer.min.js"></script>
    <script language="javascript" type="text/javascript" src="/~huddlej/js/jqplot.canvasTextRenderer.min.js"></script>
    <script language="javascript" type="text/javascript" src="/~huddlej/js/jqplot.canvasAxisLabelRenderer.min.js"></script>
    <script language="javascript" type="text/javascript" src="/~huddlej/js/jqplot.categoryAxisRenderer.min.js"></script>
    <script language="javascript" type="text/javascript" src="/~huddlej/js/speciesData.js"></script>

    <!--[if IE]><script language="javascript" type="text/javascript" src="/~huddlej/js/excanvas.min.js"></script><![endif]-->
    <link rel="stylesheet" href="/~huddlej/css/jquery.jqplot.min.css" type="text/css">

    <script type="text/javascript">
    function initialize() {
      if (GBrowserIsCompatible() && jQuery("#map").length > 0) {
        var map = new GMap2(document.getElementById("map"));
        map.setCenter(new GLatLng(37.4419, -122.1419), 13);
        map.setUIToDefault();
      }
    }
    </script>
    <?php
  }
  ?>
  <?php tpl_metaheaders()?>

  <link rel="shortcut icon" href="<?php echo DOKU_TPL?>images/favicon.ico" />

  <?php /*old includehook*/ @include(dirname(__FILE__).'/meta.html')?>
</head>

<body onload="initialize()" onunload="GUnload()">
<?php /*old includehook*/ @include(dirname(__FILE__).'/topheader.html')?>
<div id="doc" class="yui-t7 dokuwiki">
  <?php html_msgarea()?>

  <div class="stylehead">

    <div id="hd" class="header" role="banner">
      <!-- start site nav -->
      <h1 id="site-id">PNW Moths</h1>
      <ol id="navigation">
          <li><a href="/dokuwiki/">Home</a></li>
          <li><a href="">Identify</a></li>
          <li><a href="">Browse</a></li>
          <li id="search"><?php tpl_searchform()?></li>
      </ol>
      <!-- end site nav -->

      <div class="pagename">
      </div>
      <div class="logo">
      </div>

      <div class="clearer"></div>
    </div>

    <?php /*old includehook*/ @include(dirname(__FILE__).'/header.html')?>

    <div class="bar" id="bar__top">
      <div class="bar-left" id="bar__topleft">
        <?php tpl_button('edit')?>
        <?php tpl_button('history')?>
      </div>

      <div class="bar-right" id="bar__topright">
        <?php tpl_button('recent')?>
      </div>

      <div class="clearer"></div>
    </div>

    <?php if($conf['breadcrumbs']){?>
    <div class="breadcrumbs">
      <?php tpl_breadcrumbs()?>
      <?php //tpl_youarehere() //(some people prefer this)?>
    </div>
    <?php }?>

    <?php if($conf['youarehere']){?>
    <div class="breadcrumbs">
      <?php tpl_youarehere() ?>
    </div>
    <?php }?>

  </div>
  <?php flush()?>

  <?php /*old includehook*/ @include(dirname(__FILE__).'/pageheader.html')?>

  <div id="bd" class="page" role="main">
    <!-- wikipage start -->
    <?php tpl_content(false)?>
    <!-- wikipage stop -->
  </div>

  <?php flush()?>

  <div class="stylefoot">
    <?php /*old includehook*/ @include(dirname(__FILE__).'/pagefooter.html')?>
    <div class="meta bar">
      <div class="user">
        <?php tpl_userinfo()?>
      </div>
      <div class="doc">
        <?php tpl_pageinfo()?>
      </div>
    </div>

    <div class="bar" id="bar__bottom">
      <div class="bar-left" id="bar__bottomleft">
        <?php tpl_button('edit')?>
        <?php tpl_button('history')?>
        <?php tpl_button('revert')?>
      </div>
      <div class="bar-right" id="bar__bottomright">
        <?php tpl_button('subscribe')?>
        <?php tpl_button('subscribens')?>
        <?php tpl_button('admin')?>
        <?php tpl_button('profile')?>
        <?php tpl_button('login')?>
        <?php tpl_button('index')?>
        <?php tpl_button('top')?>&nbsp;
      </div>
      <div class="clearer"></div>
    </div>
  </div>

  <div id="ft" class="stylefoot" role="contentinfo">
    <ol id="ft-navigation">
      <li><a href="">About the Project</a>
      <li><a href="">Contact Us</a>
    </ol>
    <p id="copyright">Copyright 2010</p>
  </div>

</div>
<?php /*old includehook*/ @include(dirname(__FILE__).'/footer.html')?>

<div class="no"><?php /* provide DokuWiki housekeeping, required in all templates */ tpl_indexerWebBug()?></div>
</body>
</html>
