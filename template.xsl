<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:variable name='xrefdoc' select="document('index.xml')"/>
<xsl:template match="/">
<html>
<head>
<title>Factsheet - <xsl:value-of select="Entity/Name"/></title>
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
        <div id="map">
          <p>Map goes here for <xsl:value-of select="Entity/Name"/></p>
        </div>
      </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
  