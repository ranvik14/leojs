//@+leo-ver=5-thin
//@+node:felix.20230723005339.1: * @file src/test/leoCompare.test.ts
/**
 * Tests of leoCompare.ts
 */
import * as assert from 'assert';
import { afterEach, before, beforeEach } from 'mocha';

import * as g from '../core/leoGlobals';
import { LeoUnitTest } from './leoTest2';

//@+others
//@+node:felix.20230723005339.2: ** suite TestCompare
suite('Test cases for leoCompare.ts', () => {

    let self: LeoUnitTest;

    before(() => {
        self = new LeoUnitTest();
        return self.setUpClass();
    });

    beforeEach(() => {
        self.setUp();
        return Promise.resolve();
    });

    afterEach(() => {
        self.tearDown();
        return Promise.resolve();
    });

    //@+others
    //@+node:felix.20230723005339.3: *3* TestCompare.test_diff_marked_nodes
    test('test_diff_marked_nodes', () => {
        console.log('TODO : test_diff_marked_nodes');

        /*
        from leo.core.leoCompare import diffMarkedNodes
        
        # Setup.
        c = self.c
        u = c.undoer
        root = c.rootPosition()
        root.deleteAllChildren()
        while root.hasNext():
            root.next().doDelete()
        c.selectPosition(root)
        
        # Create two sets of nodes.
        node1 = root.insertAsLastChild()
        node2 = root.insertAsLastChild()
        child1 = node1.insertAsLastChild()
        child2 = node2.insertAsLastChild()
        
        # Mark the nodes.
        node1.setMarked()
        node2.setMarked()
        
        # Populate the nodes.
        table = (
            (node1, 'node 1', '# Node 1.\n'),
            (node2, 'node 1a', '# Node 1.\n'),  # Headlines differ.
            (child1, 'child 1', '# Child 1.\n'),
            (child2, 'child 1', '# Child 1a.\n'),  # Bodies differ.
        )
        for p, h, b in table:
            p.h = h
            p.b = b
        self.assertEqual(c.lastTopLevel(), root)

        # Run the command.
        diffMarkedNodes(event={'c': c})
        self.assertEqual(c.lastTopLevel().h, 'diff marked nodes')
        u.undo()
        self.assertEqual(c.lastTopLevel(), root)
        u.redo()
        self.assertEqual(c.lastTopLevel().h, 'diff marked nodes')
        */

    });
    //@+node:felix.20230723005339.4: *3* TestCompare.test_diff_list_of_files
    test('test_diff_list_of_files', () => {
        console.log('TODO : test_diff_list_of_files');

        /*
        from leo.core.leoCompare import CompareLeoOutlines

        # Setup.
        c = self.c
        u = c.undoer
        x = CompareLeoOutlines(c)
        root = c.rootPosition()
        root.deleteAllChildren()
        while root.hasNext():
            root.next().doDelete()
        c.selectPosition(root)
        self.assertEqual(c.lastTopLevel(), root)
        
        # The contents of a small .leo file.
        contents1 = textwrap.dedent(
            """
            <?xml version="1.0" encoding="utf-8"?>
            <!-- Created by Leo: https://leo-editor.github.io/leo-editor/leo_toc.html -->
            <leo_file xmlns:leo="http://leo-editor.github.io/leo-editor/namespaces/leo-python-editor/1.1" >
            <leo_header file_format="2"/>
            <globals/>
            <preferences/>
            <find_panel_settings/>
            <vnodes>
            <v t="ekr.20230714162224.2"><vh>test_file1.leo</vh></v>
            </vnodes>
            <tnodes>
            <t tx="ekr.20230714162224.2"></t>
            </tnodes>
            </leo_file>
            """).lstrip()  # Leo doesn't tolerate a leading blank line!
        contents2 = contents1.replace('test_file1.leo', 'test_file2.leo')
        
        # Create the absolute paths.
        directory = tempfile.gettempdir()
        path1 = os.path.normpath(os.path.join(directory, 'test_file1.leo'))
        path2 = os.path.normpath(os.path.join(directory, 'test_file2.leo'))
        paths = [path1, path2]

        # Create two temp .leo files.
        for path, contents in ((path1, contents1), (path2, contents2)):
            with open(path, 'wb') as f:
                f.write(g.toEncodedString(contents))

        # Run the command.
        expected_last_headline = 'diff-leo-files'
        x.diff_list_of_files(paths)
        self.assertEqual(c.lastTopLevel().h, expected_last_headline)
        
        # Test undo and redo.
        u.undo()
        self.assertEqual(c.lastTopLevel(), root)
        u.redo()
        self.assertEqual(c.lastTopLevel().h, expected_last_headline)
        
        # Remove temporary files.
        for path in paths:
            self.assertTrue(os.path.exists(path), msg=path)
            os.remove(path)
            self.assertFalse(os.path.exists(path), msg=path)
        */

    });
    //@-others

});
//@-others
//@-leo
