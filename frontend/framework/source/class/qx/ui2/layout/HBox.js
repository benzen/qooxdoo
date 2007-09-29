/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2007 1&1 Internet AG, Germany, http://www.1and1.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A full feature horizontal box layout.
 *
 * Supports:
 *
 * * Integer dimensions (using widget properties)
 * * Min and max dimensions (using widget properties)
 * * Priorized stretching (flex) (using layout properties)
 * * Respect for min and max dimensions is included
 * * Intelligent fallbacks make it possible to have nearly unconfigured (but already working) horizontal boxes.
 * * Margins (even negative ones) for left and right with margin collapsing support. (using layout properties)
 * * Offset for top and bottom which behaves like relative positioned elements in CSS. (using layout properties)
 * * Auto sizing, including support for margin & spacing.
 *
 * Notes:
 *
 * * Offsets are not respected by auto-sizing
 * * The top offset wins when both, top and bottom are defined (like in CSS)
 */
qx.Class.define("qx.ui2.layout.HBox",
{
  extend : qx.ui2.layout.Abstract,






  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    spacing :
    {
      check : "Integer",
      init : 5
    },

    align :
    {
      check : [ "left", "center", "right" ],
      init : "left"
    },

    reversed :
    {
      check : "Boolean",
      init : false
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    add : function(widget, flex, align)
    {
      this.base(arguments, widget);
      this._importProperties(widget, arguments, "hbox.flex", "hbox.align");
    },


    // overridden
    layout : function(availWidth, availHeight)
    {
      // Initialize
      var children = this.getChildren();
      var align = this.getAlign();
      var child, childHint;
      var childHeight, childAlign, childTop, childLeft;
      var childTop, childBottom;
      var childGrow;



      // Support for reversed children
      if (this.getReversed()) {
        children = children.concat().reverse();
      }
      


      // Creating dimension working data
      var childWidths = [];
      var childHeights = [];
      var childHints = [];
      var usedWidth = this._getHorizontalSpacing();
      
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        childHint = child.getSizeHint();
        
        childHints[i] = childHint;
        childWidths[i] = childHint.width;
        childHeights[i] = childHint.height;
        
        usedWidth += childHint.width;
      }      

      this.debug("Initial widths: avail=" + availWidth + ", used=" + usedWidth);
      
      

      // Process widths for flex stretching/shrinking
      if (usedWidth != availWidth)
      {
        var flexibleChildren = [];
        
        for (var i=0, l=children.length; i<l; i++)
        {
          child = children[i];
          childGrow = usedWidth < availWidth;
        
          if (child.canStretchX())
          {
            childFlex = child.getLayoutProperty("hbox.flex");

            if (childFlex == null || childFlex > 0)
            {
              childHint = childHints[i];

              flexibleChildren.push({
                id : i,
                potential : childGrow ? childHint.maxWidth - childHint.width : childHint.width - childHint.minWidth,
                flex : childFlex || 1
              });
            }
          }
        }
        
        if (flexibleChildren.length > 0) 
        {
          var flexibleOffsets = qx.ui2.layout.Util.computeFlexOffsets(flexibleChildren, availWidth - usedWidth);
          
          for (var key in flexibleOffsets) 
          {
            this.debug("  - Correcting child[" + key + "] by: " + flexibleOffsets[key]);
            
            childWidths[key] += flexibleOffsets[key];
            usedWidth += flexibleOffsets[key];
          }          
        }       
      }

      this.debug("Corrected widths: avail=" + availWidth + ", used=" + usedWidth);



      // Calculate horizontal alignment offset
      var spacingSum = this._getHorizontalSpacing();
      var childAlignOffset = 0;
      if (usedWidth < availWidth && align != "left")
      {
        childAlignOffset = availWidth - usedWidth;

        if (align === "center") {
          childAlignOffset = Math.round(childAlignOffset / 2);
        }
      }
      
      this.debug("Alignment offset: value=" + childAlignOffset);



      // Iterate over children
      var spacing = this.getSpacing();
      var childLeft = children[0].getLayoutProperty("hbox.marginLeft") || 0;
      var useMargin;

      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];

        if (childLeft < availWidth)
        {
          // Read child data
          childHeight = childHeights[i];
          childAlign = child.getLayoutProperty("hbox.align");
          childRelTop = child.getLayoutProperty("hbox.top");
          childRelBottom = child.getLayoutProperty("hbox.bottom");

          // Respect vertical alignment
          childTop = qx.ui2.layout.Util.computeVerticalAlignOffset(childAlign, childHeight, availHeight);

          // Apply offset
          if (childRelTop) {
            childTop += childRelTop;
          } else if (childRelBottom) {
            childTop -= childRelBottom;
          }

          // Layout child
          child.layout(childLeft + childAlignOffset, childTop, childWidths[i], childHeight);
          child.include();
        }
        else
        {
          // Exclude (completely) hidden children
          child.exclude();
        }

        // last one => exit here
        if (i==(l-1)) {
          break;
        }

        // otherwise add width, spacing and margin
        thisMargin = children[i].getLayoutProperty("hbox.marginRight");
        nextMargin = children[i+1].getLayoutProperty("hbox.marginLeft");

        // Math.max detects 'null' as more ('0') than '-1'
        // we need to work around this
        if (thisMargin && nextMargin) {
          useMargin = Math.max(thisMargin, nextMargin);
        } else if (nextMargin) {
          useMargin = nextMargin;
        } else if (thisMargin) {
          useMargin = thisMargin;
        } else {
          useMargin = 0;
        }

        childLeft += childWidths[i] + spacing + useMargin;
      }
    },


    // overridden
    getSizeHint : function()
    {
      if (this._sizeHint) {
        return this._sizeHint;
      }

      // Start with spacing
      var children = this.getChildren();
      var spacing = this._getHorizontalSpacing();

      // Initialize
      var minWidth=spacing, width=spacing, maxWidth=spacing;
      var minHeight=0, height=0, maxHeight=32000;
      var offset, offsetTop, offsetBottom, align;

      // Support for reversed children
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Iterate
      // - sum children width
      // - find max heights
      for (var i=0, l=children.length; i<l; i++)
      {
        var child = children[i];
        var childHint = child.getSizeHint();

        minWidth += childHint.minWidth;
        width += childHint.width;
        maxWidth += childHint.maxWidth;

        minHeight = Math.max(0, minHeight, childHint.minHeight);
        height = Math.max(0, height, childHint.height);
        maxHeight = Math.min(32000, maxHeight, childHint.maxHeight);
      }


      // Limit width to integer range
      minWidth = Math.min(32000, Math.max(0, minWidth));
      width = Math.min(32000, Math.max(0, width));
      maxWidth = Math.min(32000, Math.max(0, maxWidth));


      // Build hint
      var hint = {
        minWidth : minWidth,
        width : width,
        maxWidth : maxWidth,
        minHeight : minHeight,
        height : height,
        maxHeight : maxHeight
      };

      this.debug("Compute size hint: ", hint);
      this._sizeHint = hint;

      return hint;
    },
    

    /** Computes the spacing sum plus margin. Supports margin collapsing. */
    _getHorizontalSpacing : function()
    {
      var children = this.getChildren();
      var length = children.length;
      var spacing = this.getSpacing() * (length - 1);
      var thisMargin, nextMargin, useMargin;

      // Support for reversed children
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Add margin left of first child (no collapsing here)
      spacing += children[0].getLayoutProperty("hbox.marginLeft") || 0;

      if (length > 0)
      {
        for (var i=0; i<length-1; i++)
        {
          thisMargin = children[i].getLayoutProperty("hbox.marginRight");
          nextMargin = children[i+1].getLayoutProperty("hbox.marginLeft");

          // Math.max detects 'null' as more ('0') than '-1'
          // we need to work around this
          if (thisMargin && nextMargin) {
            useMargin = Math.max(thisMargin, nextMargin);
          } else if (nextMargin) {
            useMargin = nextMargin;
          } else if (thisMargin) {
            useMargin = thisMargin;
          } else {
            useMargin = 0;
          }

          spacing += useMargin;
        }
      }

      // Add margin right of last child (no collapsing here)
      spacing += children[length-1].getLayoutProperty("hbox.marginRight") || 0;

      return spacing;
    }    
  }
});
