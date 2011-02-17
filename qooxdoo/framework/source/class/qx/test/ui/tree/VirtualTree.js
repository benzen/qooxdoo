/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/* ************************************************************************

#ignore(qx.test.ui.tree.Leaf)
#ignore(qx.test.ui.tree.Node)

************************************************************************ */

qx.Class.define("qx.test.ui.tree.VirtualTree",
{
  extend : qx.test.ui.LayoutTestCase,


  construct : function()
  {
    this.base(arguments);

    qx.Class.define("qx.test.ui.tree.Leaf",
    {
      extend : qx.core.Object,

      construct : function(name)
      {
        this.base(arguments);

        this.setName(name);
      },

      properties :
      {
        name :
        {
          check : "String",
          event : "changeName",
          nullable : true
        }
      }
    });

    qx.Class.define("qx.test.ui.tree.Node",
    {
      extend : qx.test.ui.tree.Leaf,

      construct : function(name, children)
      {
        this.base(arguments, name);

        if (children == null) {
          children = [];
        }
        this.setChildren(children);
      },

      properties :
      {
        children :
        {
          check : "Array",
          event : "changeChildren",
          nullable : true
        }
      },

      destruct : function()
      {
        if (!qx.core.ObjectRegistry.inShutDown)
        {
          var children = this.getChildren();
          for (var i = 0; i  < children.length; i++) {
            children[i].dispose();
          }
          this.setChildren(null);
        }
      }
    });
  },


  members :
  {
    tree : null,


    setUp : function()
    {
      this.base(arguments);

      this.tree = new qx.ui.tree.VirtualTree();
      this.getRoot().add(this.tree);
    },


    tearDown : function()
    {
      this.base(arguments);

      this.tree.dispose();
      this.tree = null;

      if (this.model != null) {
        this.model.dispose();
        this.model = null;
      }
    },


    createModel : function(level)
    {
      var root = new qx.test.ui.tree.Node("Root node");
      this.__createNodes(root, level);

      return root;
    },


    createModelAndSetModel : function(level)
    {
      this.model = this.createModel(3);
      this.tree.setLabelPath("name");
      this.tree.setChildProperty("children");
      this.tree.setModel(this.model);
      return this.model;
    },


    testCreation : function()
    {
      this.assertEquals("virtual-tree", this.tree.getAppearance(), "Init value for 'appearance' is wrong!");
      this.assertTrue(this.tree.getFocusable(), "Init value for 'focusable' is wrong!");
      this.assertEquals(100, this.tree.getWidth(), "Init value for 'width' is wrong!");
      this.assertEquals(200, this.tree.getHeight(), "Init value for 'height' is wrong!");
      this.assertEquals(25, this.tree.getItemHeight(), "Init value for 'itemHeight' is wrong!");
      this.assertEquals(25, this.tree.getPane().getRowConfig().getDefaultItemSize(), "Init value for 'itemHeight' is wrong!");
      this.assertEquals("dblclick", this.tree.getOpenMode(), "Init value for 'openMode' is wrong!");
      this.assertFalse(this.tree.getHideRoot(), "Init value for 'hideRoot' is wrong!");
      this.assertFalse(this.tree.getRootOpenClose(), "Init value for 'rootOpenClose' is wrong!");
      this.assertNull(this.tree.getModel(), "Init value for 'model' is wrong!");
      this.assertNull(this.tree.getLabelPath(), "Init value for 'labelPath' is wrong!");
      this.assertNull(this.tree.getChildProperty(), "Init value for 'childProperty' is wrong!");
    },


    testSetItemHeight : function()
    {
      this.tree.setItemHeight(30);
      this.assertEquals(30, this.tree.getPane().getRowConfig().getDefaultItemSize());
    },


    testSetModel : function()
    {
      var model = this.createModelAndSetModel(3);
      this.assertEquals(model, this.tree.getModel());
    },


    testResetModel : function()
    {
      var oldModel = this.tree.getModel();

      this.createModelAndSetModel(3);

      this.tree.resetModel();
      this.assertEquals(oldModel, this.tree.getModel());
    },


    testBuildLookupTable : function()
    {
      var root = this.createModelAndSetModel(3);

      var expected = this.__getVisibleItemsFrom(root, [root]);
      qx.lang.Array.insertAt(expected, root, 0);

      this.__testBuildLookupTable(expected);
    },


    testBuildLookupTableWithOpenNodes : function()
    {
      var root = this.createModelAndSetModel(3);

      var openNodes = [
        root,
        root.getChildren()[9],
        root.getChildren()[9].getChildren()[5]
      ];

      for (var i = 0; i < openNodes.length; i++) {
        this.tree.openNode(openNodes[i]);
      }

      var expected = this.__getVisibleItemsFrom(root, openNodes);
      qx.lang.Array.insertAt(expected, root, 0);

      this.__testBuildLookupTable(expected);
    },


    testBuildLookupTableWithRemovedNodes : function()
    {
      var root = this.createModelAndSetModel(3);

      var openNodes = [
        root,
        root.getChildren()[9],
        root.getChildren()[9].getChildren()[5]
      ];

      for (var i = 0; i < openNodes.length; i++) {
        this.tree.openNode(openNodes[i]);
      }

      this.tree.closeNode(openNodes[openNodes.length - 1]);
      openNodes.pop();

      var expected = this.__getVisibleItemsFrom(root, openNodes);
      qx.lang.Array.insertAt(expected, root, 0);

      this.__testBuildLookupTable(expected);
    },


    testBuildLookupTableWithClosedRoot : function()
    {
      var root = this.createModelAndSetModel(3);

      this.tree.closeNode(root);
      this.__testBuildLookupTable([root]);
    },


    __testBuildLookupTable : function(expected)
    {
      this.assertArrayEquals(expected, this.tree.getLookupTable());
      this.assertEquals(expected.length, this.tree.getPane().getRowConfig().getItemCount());
    },


    testGetOpenNodes : function()
    {
      var root = this.createModelAndSetModel(3);
      this.assertArrayEquals([root], this.tree.getOpenNodes());
    },


    testIsNodeOpen : function()
    {
      var root = this.createModelAndSetModel(3);

      this.tree.openNode(root);
      this.tree.openNode(root.getChildren()[0]);

      this.assertTrue(this.tree.isNodeOpen(root));
      this.assertTrue(this.tree.isNodeOpen(root.getChildren()[0]));
      this.assertFalse(this.tree.isNodeOpen(root.getChildren()[1]));
    },


    testOpenNode : function()
    {
      var root = this.createModelAndSetModel(3);

      var expectedOpen = [];
      expectedOpen.push(root);
      expectedOpen.push(root.getChildren()[0]);

      this.tree.openNode(root.getChildren()[0]);
      this.assertArrayEquals(expectedOpen, this.tree.getOpenNodes());

      this.tree.openNode(root.getChildren()[0]);
      this.assertArrayEquals(expectedOpen, this.tree.getOpenNodes());
    },


    testCloseNode : function()
    {
      var root = this.createModelAndSetModel(3);

      var expectedOpen = [];
      expectedOpen.push(root);
      expectedOpen.push(root.getChildren()[0]);

      this.tree.openNode(root.getChildren()[0]);
      this.assertArrayEquals(expectedOpen, this.tree.getOpenNodes());

      this.tree.closeNode(root.getChildren()[0]);
      expectedOpen.pop();
      this.assertArrayEquals(expectedOpen, this.tree.getOpenNodes());
    },


    testCloseNodeWithRoot : function()
    {
      var root = this.createModelAndSetModel(3);

      var expectedOpen = [];
      expectedOpen.push(root);
      expectedOpen.push(root.getChildren()[0]);

      this.tree.openNode(root.getChildren()[0]);
      this.assertArrayEquals(expectedOpen, this.tree.getOpenNodes());

      this.tree.closeNode(root.getChildren()[0]);
      this.tree.closeNode(root);
      this.assertArrayEquals([], this.tree.getOpenNodes());
    },


    testOpenNodeWithParents : function()
    {
      var root = this.createModelAndSetModel(3);

      var expectedOpen = [];
      expectedOpen.push(root);
      expectedOpen.push(root.getChildren()[9]);
      expectedOpen.push(root.getChildren()[9].getChildren()[9]);
      expectedOpen.push(root.getChildren()[9].getChildren()[9].getChildren()[9]);

      this.tree.openNodeAndParents(root.getChildren()[9].getChildren()[9].getChildren()[9]);

      var openNodes = this.tree.getOpenNodes();
      this.assertEquals(expectedOpen.length, openNodes.length);
      for (var i = 0; i < expectedOpen.length; i++) {
        this.assertTrue(qx.lang.Array.contains(openNodes, expectedOpen[i]));
      }
    },


    testIsNode : function()
    {
      var root = this.createModelAndSetModel(3);

      this.assertTrue(this.tree.isNode(root));
      this.assertTrue(this.tree.isNode(root.getChildren()[9]));
      this.assertTrue(this.tree.isNode(root.getChildren()[9].getChildren()[9]));
      this.assertTrue(this.tree.isNode(root.getChildren()[9].getChildren()[9].getChildren()[9]));
      this.assertFalse(this.tree.isNode(root.getChildren()[9].getChildren()[9].getChildren()[9].getChildren()[9]));
    },


    testGetLevel : function()
    {
      var root = this.createModelAndSetModel(3);

      this.tree.openNode(root.getChildren()[5]);
      this.tree.openNode(root.getChildren()[5].getChildren()[7]);
      this.tree.openNode(root.getChildren()[5].getChildren()[7].getChildren()[1]);

      this.assertEquals(0, this.tree.getLevel(this.__getRowFrom(root)));
      this.assertEquals(1, this.tree.getLevel(this.__getRowFrom(root.getChildren()[5])));
      this.assertEquals(2, this.tree.getLevel(this.__getRowFrom(root.getChildren()[5].getChildren()[7])));
      this.assertEquals(3, this.tree.getLevel(this.__getRowFrom(root.getChildren()[5].getChildren()[7].getChildren()[1])));
      this.assertEquals(4, this.tree.getLevel(this.__getRowFrom(root.getChildren()[5].getChildren()[7].getChildren()[1].getChildren()[9])));
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS TO CREATE A TREE STRUCTURE
    ---------------------------------------------------------------------------
    */


    __createNodes : function(parent, level) {
      if (level > 0)
      {
        for (var i = 0; i < 10; i++)
        {
          var item = new qx.test.ui.tree.Node("Node " + this.__getPrefix(parent.getName()) + i);
          parent.getChildren().push(item);

          this.__createNodes(item, level - 1);
          this.__createLeafs(item);
        }
      }
    },


    __createLeafs : function(parent)
    {
      for (var i = 0; i < 10; i++)
      {
        var child = new qx.test.ui.tree.Leaf("Leaf " + this.__getPrefix(parent.name) + i);
        parent.getChildren().push(child);
      }
    },


    __getPrefix : function(name)
    {
      var prefix = "";
      if (qx.lang.String.startsWith(name, "Node")) {
        prefix = name.substr(5, name.length - 5) + ".";
      }
      return prefix;
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHOD TO CALCULATE THE VISIBLE ITEMS
    ---------------------------------------------------------------------------
    */


    __getVisibleItemsFrom : function(parent, openNodes)
    {
      var expected = [];

      if (parent.getChildren() != null)
      {
        for (var i = 0; i < parent.getChildren().length; i++)
        {
          var child = parent.getChildren()[i];
          expected.push(child);

          if (openNodes.indexOf(child) > -1)
          {
            var otherExpected = this.__getVisibleItemsFrom(child, openNodes);
            expected = expected.concat(otherExpected);
          }
        }
      }

      return expected;
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHOD TO CALCULATE THE VISIBLE ITEMS
    ---------------------------------------------------------------------------
    */


    __getRowFrom : function(item) {
      return this.tree.getLookupTable().indexOf(item);
    }
  },


  destruct : function() {
    qx.Class.undefine("qx.test.ui.tree.Leaf");
    qx.Class.undefine("qx.test.ui.tree.Node");
  }
});