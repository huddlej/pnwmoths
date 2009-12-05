<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:variable name='xrefdoc' select="document('index.xml')"/>
<xsl:template match="/">
<html>
<head>
<title>Factsheet - <xsl:value-of select="Entity/Name"/></title>
<link rel="stylesheet" href="moths.css" type="text/css" />
<script src="jquery.js" type="text/javascript"></script>
<script src="jquery.csv.js" type="text/javascript"></script>
<script src="jquery.labelify.js" type="text/javascript"></script>
<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAA_cr19ifAS821S0ocdvCL1BRBVpSfLWxlPQoCmwY1fCdcuyF71BQJy8IHFHHJzbfht-rzClPWQbecag"
        type="text/javascript"></script>
<script src="http://gmaps-utility-library.googlecode.com/svn/trunk/markermanager/release/src/markermanager.js" type="text/javascript"></script>
<script src="data.js" type="text/javascript"></script>
<script src="framework.js" type="text/javascript"></script>
<script src="moths.js" type="text/javascript"></script>
<link rel="stylesheet" href="template.css" type="text/css"/>
</head>
<body>
<a name="top"></a>
<div id="banner">
        <div class="bannertitle" id="title">
          <xsl:value-of select="Entity/Name"/>
        </div>
      </div>
<div id="menu">
        <a href="index.htm" class="menu">
          List of Fact Sheets
        </a>
        <a href="glossary.htm" target="_blank"  class="menu">
          Glossary
        </a>
      </div>
<div id="alphabet">
        <xsl:for-each select="$xrefdoc//Entity/Group">
          <xsl:choose>
            <xsl:when test="Item">
              <a class="alphabet">
                <xsl:attribute name="href">
                  <xsl:text/>index.htm#<xsl:value-of select="Letter"/>
                </xsl:attribute>
                <xsl:value-of select="Letter"/>
              </a>
            </xsl:when>
            <xsl:otherwise>
              <span class="menudisabled">
                <xsl:value-of select="Letter" />
              </span>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:for-each>
      </div>
<xsl:if test="count(Entity/Media/Image/File) > 0">
        <div id="thumbnails">
          <xsl:if test="count(Entity/Media/Image/File) &lt;= 10">
            <table>
              <xsl:for-each select="Entity/Media">
                <xsl:for-each select="Image">
                  <tr>
                    <td class="thumbnail"><a>
                        <xsl:attribute name="href">
                          <xsl:text/>
                          <xsl:value-of select="File"/>
                        </xsl:attribute>
                        <img class="thumbnail">
                        <xsl:attribute name="Name"></xsl:attribute>
                        <xsl:attribute name="src">
                          <xsl:text/>
                          <xsl:value-of select="Thumb"/>
                        </xsl:attribute>
                        </img>
                      </a>
                      <div class="caption">
                        <xsl:value-of select="Caption" disable-output-escaping="yes"/>
                      </div></td>
                  </tr>
                </xsl:for-each>
              </xsl:for-each>
            </table>
          </xsl:if>
          <xsl:if test="count(Entity/Media/Image/File) &gt; 10">
            <table>
              <xsl:for-each select="Entity/Media">
                <xsl:for-each select="Image[position() mod 2 = 1]">
                  <tr>
                    <xsl:for-each select=". | following-sibling::Image[position() &lt; 2]">
                      <td class="thumbnail"><a>
                          <xsl:attribute name="href">
                            <xsl:text/>
                            <xsl:value-of select="File"/>
                          </xsl:attribute>
                          <img class="thumbnail">
                          <xsl:attribute name="Name"></xsl:attribute>
                          <xsl:attribute name="src">
                            <xsl:text/>
                            <xsl:value-of select="Thumb"/>
                          </xsl:attribute>
                          </img>
                        </a>
                        <div class="caption">
                          <xsl:value-of select="Caption" disable-output-escaping="yes"/>
                        </div></td>
                    </xsl:for-each>
                  </tr>
                </xsl:for-each>
              </xsl:for-each>
            </table>
          </xsl:if>
        </div>
      </xsl:if>
<div id="map-container">
    <div id="map"></div>
    <div id="notes">
        <p>Note:</p>
        <ul>
            <li>Dot size indicates GPS coordinate precision: smaller dots = greater precision.</li>
            <li>Protected species are not visible at high zoom levels.</li>
        </ul>
    </div>
    <div id="filters">
      <ul>
        <li><a href="#" id="clear-filters">Clear filters</a></li>
        <li id="filter-elevation">Elevation (ft.)
          <ul>
            <li><a class="selected all" href="" id="clear-filter-elevation">All elevations</a></li>
            <li>
              <form id="form-elevation">
                <input type="text" id="startelevation" size="5" /> -
                <input type="text" id="endelevation" size="5" />
                <input type="submit" value="Filter" />
                <br />
                <span class="help">(e.g., 2000 - 10000)</span>
              </form>
            </li>
          </ul>
        </li>
        <li id="filter-date">Date
          <ul>
            <li><a class="selected all" href="" id="clear-filter-date">All dates</a></li>
            <li>
              <form id="form-date">
                <label for="startyear">Start:</label>
                <input type="text" id="startday" size="4" title="day" />
                <select id="startmonth" size="1"></select>
                <input type="text" id="startyear" size="4" title="year" />
                <br />
                <label for="endyear">End:</label>
                <input type="text" id="endday" size="4" title="day" />
                <select id="endmonth" size="1"></select>
                <input type="text" id="endyear" size="4" title="year" />
                <br />
                <input type="submit" value="Filter" />
                <span class="help">(e.g., 1 January 1999 - 1 December 2000)</span>
              </form>
            </li>
          </ul>
        </li>
      </ul>
    </div>
</div>
<div id="content">
        <xsl:for-each select="Entity/Topic">
          <h1>
            <xsl:value-of select="Name"/>
          </h1>
          <xsl:value-of select="Content" disable-output-escaping="yes"/>
          <xsl:if test="position() mod 5 = 0">
            <p class="top" align="right">
              <a href="#top">
                Top
              </a>
            </p>
          </xsl:if>
        </xsl:for-each>
      </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
