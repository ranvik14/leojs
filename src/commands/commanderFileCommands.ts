//@+leo-ver=5-thin
//@+node:felix.20211017230407.1: * @file src/commands/commanderFileCommands.ts
// File commands that used to be defined in leoCommands.py
// import * as fs from 'fs';
import * as vscode from "vscode";

import * as g from '../core/leoGlobals';
import { commander_command } from "../core/decorators";
import { StackEntry, Position, VNode } from "../core/leoNodes";
import { FastRead, FileCommands } from "../core/leoFileCommands";
import { Commands, HoistStackEntry } from "../core/leoCommands";
import { Bead, Undoer } from '../core/leoUndo';
import { LoadManager, PreviousSettings } from "../core/leoApp";
import { AtFile } from '../core/leoAtFile';

//@+others
//@+node:felix.20220105223215.1: ** function: import_txt_file
/**
 * Import the .txt file into a new node.
 */
async function import_txt_file(c: Commands, fn: string): Promise<void> {
    const u = c.undoer;
    g.setGlobalOpenDir(fn);
    const undoData = u.beforeInsertNode(c.p);
    const last = c.lastTopLevel();
    const p = last.insertAfter();
    p.h = `@edit ${fn}`;
    let s: string | undefined;
    let e: any;
    [s, e] = await g.readFileIntoString(fn, undefined, '@edit');
    p.b = s!;
    u.afterInsertNode(p, 'Import', undoData);
    c.setChanged();
    c.redraw(p);
}
//@+node:felix.20220105222714.1: ** function: reloadSettingsHelper
/**
 * Reload settings in all commanders, or just c.
 *
 * A helper function for reload-settings and reload-all-settings.
 */
function reloadSettingsHelper(c: Commands): void {

    // ? needed ?
    // TODO
    /*
    const lm : LoadManager = g.app.loadManager!;
    // Save any changes so they can be seen.
    for (let c2 of g.app.commanders()){
        if (c2.isChanged()){
            c2.save();
        }
    }

    lm.readGlobalSettingsFiles();
        // Read leoSettings.leo and myLeoSettings.leo, using a null gui.

    for (let w_c of g.app.commanders()){
        previousSettings = lm.getPreviousSettings(w_c.mFileName);
            // Read the local file, using a null gui.
        w_c.initSettings(previousSettings);
            // Init the config classes.
        w_c.initConfigSettings();
            // Init the commander config ivars.
        w_c.reloadConfigurableSettings();
            // Reload settings in all configurable classes
        // c.redraw()
            // Redraw so a pasted temp node isn't visible
    }
    */
}
//@+node:felix.20220105212849.1: ** Class CommanderFileCommands
export class CommanderFileCommands {

    //@+others
    //@+node:felix.20211017230407.2: *3* commanderFileCommandsTest
    @commander_command(
        'test-commander-files',
        'Test commanderFileCommandsTest method in CommanderFileCommands'
    )
    public commanderFileCommandsTest(this: Commands): void {
        const c: Commands = this;

        console.log('CommanderFileCommands TEST Called!!');

    }

    //@+node:felix.20220105210716.2: *3* c_file.reloadSettings
    @commander_command(
        'reload-settings',
        'Reload settings for the selected outline, saving it if necessary.'
    )
    public reloadSettings(this: Commands): void {
        const c: Commands = this;
        reloadSettingsHelper(c);
    }
    //@+node:felix.20220105210716.4: *3* c_file.restartLeo
    @commander_command(
        'restart-leo',
        'Restart Leo, reloading all presently open outlines.'
    )
    public restartLeo(this: Commands): void {

        const c: Commands = this;
        const lm: LoadManager = g.app.loadManager!;

        // TODO
        console.log('TODO : restartLeo');

        /*
        trace = 'shutdown' in g.app.debug
        // 1. Write .leoRecentFiles.txt.
        g.app.recentFilesManager.writeRecentFilesFile(c)
        // 2. Abort the restart if the user veto's any close.
        for c in g.app.commanders():
            if c.changed:
                veto = False
                try:
                    c.promptingForClose = True
                    veto = c.frame.promptForSave()
                finally:
                    c.promptingForClose = False
                if veto:
                    g.es_print('Cancelling restart-leo command')
                    return
        // 3. Officially begin the restart process. A flag for efc.ask.
        g.app.restarting = True  // #1240.
        // 4. Save session data.
        if g.app.sessionManager:
            g.app.sessionManager.save_snapshot()
        // 5. Close all unsaved outlines.
        g.app.setLog(None)  // Kill the log.
        for c in g.app.commanders():
            frame = c.frame
            // This is similar to g.app.closeLeoWindow.
            g.doHook("close-frame", c=c)
            // Save the window state
            g.app.commander_cacher.commit()  // store cache, but don't close it.
            // This may remove frame from the window list.
            if frame in g.app.windowList:
                g.app.destroyWindow(frame)
                g.app.windowList.remove(frame)
            else:
                // #69.
                g.app.forgetOpenFile(fn=c.fileName())
        // 6. Complete the shutdown.
        g.app.finishQuit()
        // 7. Restart, restoring the original command line.
        args = ['-c'] + [z for z in lm.old_argv]
        if trace:
            g.trace('restarting with args', args)
        sys.stdout.flush()
        sys.stderr.flush()
        os.execv(sys.executable, args)
        */
    }
    //@+node:felix.20220105210716.5: *3* c_file.top level
    //@+node:felix.20220105210716.6: *4* c_file.close
    @commander_command(
        'close-window',
        'Close the Leo window, prompting to save it if it has been changed.'
    )
    public close(this: Commands, new_c?: Commands): void {

        // TODO
        console.log('TODO : closeLeoWindow');

        /*
        g.app.closeLeoWindow(this.frame, new_c);
        */
    }
    //@+node:felix.20220105210716.7: *4* c_file.importAnyFile & helper
    @commander_command(
        'import-file',
        'Import one or more files.'
    )
    public importAnyFile(this: Commands): void {

        const c: Commands = this;

        const ic: any = c.importCommands;

        const types: [string, string][] = [
            ["All files", "*"],
            ["C/C++ files", "*.c"],
            ["C/C++ files", "*.cpp"],
            ["C/C++ files", "*.h"],
            ["C/C++ files", "*.hpp"],
            ["FreeMind files", "*.mm.html"],
            ["Java files", "*.java"],
            ["JavaScript files", "*.js"],
            // ["JSON files", "*.json"],
            ["Mindjet files", "*.csv"],
            ["MORE files", "*.MORE"],
            ["Lua files", "*.lua"],
            ["Pascal files", "*.pas"],
            ["Python files", "*.py"],
            ["Text files", "*.txt"]
        ];

        g.app.gui!.runOpenFileDialog(
            c,
            "Import File",
            types,
            ".py",
            true).then((names) => {

                console.log('GOT NAMES FOR FILE IMPORT!', names);

                // TODO
                /*
                c.bringToFront()

                if names
                    g.chdir(names[0]);
                else
                    names = [];

                if not names
                    if g.unitTesting
                        // a kludge for unit testing.
                        c.init_error_dialogs();
                        c.raise_error_dialogs('read');


                    return;

                // New in Leo 4.9: choose the type of import based on the extension.
                c.init_error_dialogs();
                derived = [z for z in names if c.looksLikeDerivedFile(z)]

                others = [z for z in names if z not in derived]

                if derived
                    ic.importDerivedFiles(c.p, derived);


                let junk: string;
                let ext: string;

                for let fn of others
                    [junk, ext] = g.os_path_splitext(fn);
                    ext = ext.lower();  // #1522
                    if ext.startswith('.')
                        ext = ext[1:];

                    if ext == 'csv'
                        ic.importMindMap([fn]);
                    else if ext in ('cw', 'cweb')
                        ic.importWebCommand([fn], "cweb");

                    // Not useful. Use @auto x.json instead.
                    // else if ext == 'json':
                        // ic.importJSON([fn])
                    else if fn.endswith('mm.html')
                        ic.importFreeMind([fn]);
                    else if ext in ('nw', 'noweb')
                        ic.importWebCommand([fn], "noweb");
                    else if ext == 'more'
                        leoImport.MORE_Importer(c).import_file(fn);  // #1522.
                    else if ext == 'txt'
                        // #1522: Create an @edit node.
                        import_txt_file(c, fn);
                    else
                        // Make *sure* that parent.b is empty.
                        last = c.lastTopLevel();
                        parent = last.insertAfter();
                        parent.v.h = 'Imported Files';
                        ic.importFilesCommand(
                            [fn],
                            parent,
                            '@auto'  // was '@clean'
                                // Experimental: attempt to use permissive section ref logic.
                        );

                    c.redraw()
                c.raise_error_dialogs('read')
                */
            });

    }

    // TODO : aliases

    /*
    g.command_alias('importAtFile', importAnyFile)
    g.command_alias('importAtRoot', importAnyFile)
    g.command_alias('importCWEBFiles', importAnyFile)
    g.command_alias('importDerivedFile', importAnyFile)
    g.command_alias('importFlattenedOutline', importAnyFile)
    g.command_alias('importMOREFiles', importAnyFile)
    g.command_alias('importNowebFiles', importAnyFile)
    g.command_alias('importTabFiles', importAnyFile)
    */
    //@+node:felix.20220105210716.9: *4* c_file.new
    @commander_command(
        'file-new',
        'Create a new Leo window.'
    )
    @commander_command(
        'new',
        'Create a new Leo window.'
    )
    public new(this: Commands, gui: any): Commands {

        // t1 = time.process_time()
        // from leo.core import leoApp
        const lm = g.app.loadManager!;
        const old_c = this;
        // Clean out the update queue so it won't interfere with the new window.
        this.outerUpdate()
        // Supress redraws until later.
        g.app.disable_redraw = true;
        // Send all log messages to the new frame.
        // g.app.setLog(None)
        // g.app.lockLog()

        // Retain all previous settings. Very important for theme code.
        // t2 = time.process_time()

        const c = g.app.newCommander(
            '',
            gui,
            new PreviousSettings(
                lm.globalSettingsDict,
                lm.globalBindingsDict,
            ));

        // t3 = time.process_time()
        // frame = c.frame
        // g.app.unlockLog()
        // if not old_c:
        //   frame.setInitialWindowGeometry()
        // #1643: This doesn't work.
        // g.app.restoreWindowState(c)
        // frame.deiconify()
        // frame.lift()
        // frame.resizePanesToRatio(frame.ratio, frame.secondary_ratio)
        // Resize the _new_ frame.
        // c.frame.createFirstTreeNode()
        // lm.createMenu(c);
        lm.finishOpen(c);
        //g.app.writeWaitingLog(c);
        g.doHook("new", { old_c: old_c, c: c, new_c: c });
        // c.setLog();
        c.clearChanged();  // Fix #387: Clear all dirty bits.
        g.app.disable_redraw = false;
        c.redraw();
        // t4 = time.process_time()
        /* 
        if 'speed' in g.app.debug:
            g.trace()
            print(
                f"    1: {t2-t1:5.2f}\n"  // 0.00 sec.
                f"    2: {t3-t2:5.2f}\n"  // 0.36 sec: c.__init__
                f"    3: {t4-t3:5.2f}\n"  // 0.17 sec: Everything else.
                f"total: {t4-t1:5.2f}"
            )
        */
        return c;  // For unit tests and scripts.

    }
    //@+node:felix.20220105210716.10: *4* c_file.open_outline
    @commander_command(
        'open-outline',
        'Open a Leo window containing the contents of a .leo file.'
    )
    public open_outline(this: Commands): void {

        const c: Commands = this;

        //@+others
        //@+node:felix.20220105210716.11: *5* function: open_completer
        function open_completer(p_c: Commands, closeFlag: boolean, fileName: string): void {

            // TODO: FINISH
            /*
            p_c.bringToFront();
            p_c.init_error_dialogs();

            let ok: boolean = false;

            if (fileName){
                if (g.app.loadManager!.isLeoFile(fileName)){
                    const c2: Commands = g.openWithFileName(fileName, p_c);
                    if (c2){
                        c2.k.makeAllBindings();
                            // Fix #579: Key bindings don't take for commands defined in plugins.
                        g.chdir(fileName);
                        g.setGlobalOpenDir(fileName);
                    }
                    if( c2 && closeFlag){
                        g.app.destroyWindow(p_c.frame);
                    }
                }else if(p_c.looksLikeDerivedFile(fileName)){
                    // Create an @file node for files containing Leo sentinels.
                    ok = p_c.importCommands.importDerivedFiles(
                        p_c.p,
                        [fileName],
                        'Open');
                }else{
                    // otherwise, create an @edit node.
                    ok = p_c.createNodeFromExternalFile(fileName);
                }
            }
            p_c.raise_error_dialogs('write');
            g.app.runAlreadyOpenDialog(p_c);
            // openWithFileName sets focus if ok.


            if (!ok){
                p_c.initialFocusHelper();
            }

            */

        }
        //@-others
        // Defines open_completer function.

        // Close the window if this command completes successfully?

        // TODO: FINISH

        /*
        let closeFlag: boolean = (
            c.frame.startupWindow &&
                // The window was open on startup
            !c.changed && !c.frame.saved &&
                // The window has never been changed
            g.app.numberOfUntitledWindows === 1
                // Only one untitled window has ever been opened
        );

        let table: [string, string][] = [
            ["Leo files", "*.leo *.db"],
            ["Python files", "*.py"],
            ["All files", "*"]
        ];

        let fileName: string = c.k?.givenArgs?.join('');

        if (fileName){
            c.open_completer(c, closeFlag, fileName);
            return;
        }

        // Equivalent to legacy code.
        g.app.gui!.runOpenFileDialog(
            c,
            "Open",
            table,
            g.defaultLeoFileExtension(c),
            false
        ).then((fileNames)=>{
            open_completer(c, closeFlag, fileNames[0]!);
        });
        */

    }
    //@+node:felix.20220105210716.12: *4* c_file.refreshFromDisk
    // refresh_pattern = re.compile(r'^(@[\w-]+)')

    @commander_command(
        'refresh-from-disk',
        'Refresh an @<file> node from disk.'
    )
    public async refreshFromDisk(this: Commands): Promise<void> {

        const c: Commands = this;
        let p: Position = this.p;
        const u: Undoer = this.undoer;

        c.nodeConflictList = [];

        const fn: string = p.anyAtFileNodeName();

        const shouldDelete: boolean = c.sqlite_connection === undefined;

        if (!fn) {
            g.warning(`not an @<file> node: ${p.h}`);
            return;
        }
        // #1603.
        const w_isDir = await g.os_path_isdir(fn);
        if (w_isDir) {
            g.warning(`not a file: ${fn}`);
            return;
        }
        const b: Bead = u.beforeChangeTree(p);
        let redraw_flag: boolean = true;
        const at: AtFile = c.atFileCommands;
        c.recreateGnxDict();
        // Fix bug 1090950 refresh from disk: cut node resurrection.
        const i: number = g.skip_id(p.h, 0, '@');
        const word = p.h.substring(0, i);
        if (word === '@auto') {
            // This includes @auto-*
            if (shouldDelete) {
                p.v._deleteAllChildren();
            }
            // Fix #451: refresh-from-disk selects wrong node.
            p = at.readOneAtAutoNode(p);
        } else if (['@thin', '@file'].includes(word)) {
            if (shouldDelete) {
                p.v._deleteAllChildren();
            }
            at.read(p);
        } else if (word === '@clean') {
            // Wishlist 148: use @auto parser if the node is empty.
            if (p.b.trim() || p.hasChildren()) {
                at.readOneAtCleanNode(p);
            } else {
                // Fix #451: refresh-from-disk selects wrong node.
                p = at.readOneAtAutoNode(p);
            }
        } else if (word === '@shadow') {
            if (shouldDelete) {
                p.v._deleteAllChildren();
            }
            at.read(p);
        } else if (word === '@edit') {
            at.readOneAtEditNode(fn, p);
            // Always deletes children.
        } else if (word === '@asis') {
            // Fix #1067.
            at.readOneAtAsisNode(fn, p);
            // Always deletes children.
        } else {
            g.es_print(`can not refresh from disk\n${p.h}`);
            redraw_flag = false;
        }
        if (redraw_flag) {
            // Fix #451: refresh-from-disk selects wrong node.
            c.selectPosition(p);
            u.afterChangeTree(p, 'refresh-from-disk', b);
            // Create the 'Recovered Nodes' tree.;
            (c.fileCommands as FileCommands).handleNodeConflicts();
            c.redraw();
        }
    }
    //@+node:felix.20220105210716.13: *4* c_file.pwd
    @commander_command(
        'pwd',
        'Prints the current working directory'
    )
    public pwd_command(this: Commands): void {
        g.es_print('pwd:', process.cwd());
    }
    //@+node:felix.20220105210716.14: *4* c_file.save
    @commander_command(
        'save',
        'Save a Leo outline to a file, using the existing file name unless fileName is given'
    )
    @commander_command(
        'file-save',
        'Save a Leo outline to a file, using the existing file name unless fileName is given'
    )
    @commander_command(
        'save-file',
        'Save a Leo outline to a file, using the existing file name unless fileName is given'
    )
    public save(this: Commands, fileName?: string): void {

        const c: Commands = this;
        let p: Position = this.p;

        // ? needed ?
        // Do this now: w may go away.
        /*
        w = g.app.gui.get_focus(c)
        inBody = g.app.gui.widget_name(w).startswith('body')
        if inBody:
            p.saveCursorAndScroll()

        */
        if (g.app.disableSave) {
            g.es("save commands disabled", "purple");
            return;
        }
        c.init_error_dialogs();
        // 2013/09/28: use the fileName keyword argument if given.
        // This supports the leoBridge.
        // Make sure we never pass None to the ctor.
        if (fileName) {
            // ? Needed ?
            // c.frame.title = g.computeWindowTitle(fileName);
            c.mFileName = fileName;
        }
        if (!c.mFileName) {
            c.frame.title = "";
            c.mFileName = "";
        }
        if (c.mFileName) {
            // Calls c.clearChanged() if no error.
            g.app.syntax_error_files = [];
            (c.fileCommands as FileCommands).save(c.mFileName);
            c.syntaxErrorDialog();
        } else {
            const root: Position = c.rootPosition()!;
            if (!root.next().__bool__() && root.isAtEditNode()) {
                // There is only a single @edit node in the outline.
                // A hack to allow "quick edit" of non-Leo files.
                // See https://bugs.launchpad.net/leo-editor/+bug/381527
                fileName = undefined;
                // Write the @edit node if needed.
                if (root.isDirty()) {
                    c.atFileCommands.writeOneAtEditNode(root);
                }
                c.clearChanged();  // Clears all dirty bits.
            } else {
                fileName = c.k.givenArgs.join('');
                if (!fileName) {
                    // ! ASYNC SOLUTION !
                    g.app.gui!.runSaveFileDialog(
                        c,
                        "Save",
                        [["Leo files", "*.leo *.db"]], // Array of arrays (one in this case)
                        g.defaultLeoFileExtension(c)
                    ).then((p_filename) => {
                        if (p_filename) {
                            // re-start this 'save' method with given filename
                            c.save(p_filename);
                        }
                    });
                    return; // EXIT !
                }
            }
            c.bringToFront();
            if (fileName) {
                // Don't change mFileName until the dialog has succeeded.
                c.mFileName = g.ensure_extension(fileName, g.defaultLeoFileExtension(c));

                // ? needed ?
                // c.frame.title = c.computeWindowTitle(c.mFileName);

                // ? needed ?
                // c.frame.setTitle(c.computeWindowTitle(c.mFileName));

                // 2013/08/04: use c.computeWindowTitle.
                c.openDirectory = g.os_path_dirname(c.mFileName);
                c.frame.openDirectory = c.openDirectory;
                // Bug fix in 4.4b2.
                // ? needed ?
                // if( g.app.qt_use_tabs && c.frame['top']){
                //     c.frame.top.leo_master.setTabName(c, c.mFileName);
                // }

                (c.fileCommands as FileCommands).save(c.mFileName);

                // ? needed ?
                // g.app.recentFilesManager.updateRecentFiles(c.mFileName);
                g.chdir(c.mFileName);
            }
        }
        // Done in FileCommands.save.
        // c.redraw_after_icons_changed()
        c.raise_error_dialogs('write');

        // ? needed ?
        // *Safely* restore focus, without using the old w directly.
        /*
        if inBody
            c.bodyWantsFocus()
            p.restoreCursorAndScroll()
        else
            c.treeWantsFocus()
        */

    }
    //@+node:felix.20220105210716.15: *4* c_file.saveAll
    @commander_command(
        'save-all',
        'Save all open tabs windows/tabs.'
    )
    public saveAll(this: Commands): void {

        const c: Commands = this;

        c.save();  // Force a write of the present window.

        for (let c2 of g.app.commanders()) {
            if (c2 !== c && c2.isChanged()) {
                c2.save();
            }
        }
        // ? needed ?
        // Restore the present tab.
        // dw = c.frame.top;  // A DynamicWindow
        // dw.select(c);
    }
    //@+node:felix.20220105210716.16: *4* c_file.saveAs
    @commander_command(
        'save-as',
        'Save a Leo outline to a file, prompting for a new filename unless fileName is given'
    )
    @commander_command(
        'file-save-as',
        'Save a Leo outline to a file, prompting for a new filename unless fileName is given'
    )
    @commander_command(
        'save-file-as',
        'Save a Leo outline to a file, prompting for a new filename unless fileName is given'
    )
    public saveAs(this: Commands, fileName?: string): void {

        const c: Commands = this;
        let p: Position = this.p;

        // ? needed ?
        // Do this now: w may go away.
        /*
        w = g.app.gui.get_focus(c)
        inBody = g.app.gui.widget_name(w).startswith('body')
        if inBody:
            p.saveCursorAndScroll()
        */

        if (g.app.disableSave) {
            g.es("save commands disabled", "purple");
            return;
        }

        c.init_error_dialogs();

        // 2013/09/28: add fileName keyword arg for leoBridge scripts.
        if (fileName) {
            // ? Needed ?
            // c.frame.title = g.computeWindowTitle(fileName);
            c.mFileName = fileName;
        }
        // Make sure we never pass None to the ctor.
        if (!c.mFileName) {
            c.frame.title = "";
        }
        if (!fileName && c.k && c.k.givenArgs) {
            fileName = c.k.givenArgs.join('');
        }
        if (!fileName) {

            g.app.gui!.runSaveFileDialog(
                c,
                "Save As",
                [["Leo files", "*.leo *.db"]], // Array of arrays (one in this case)
                g.defaultLeoFileExtension(c)
            ).then((p_filename) => {
                if (p_filename) {
                    // re-start this 'save' method with given filename
                    c.saveAs(p_filename);
                }
            });
            return; // EXIT !

        }
        // c.bringToFront();

        if (fileName) {
            // Fix bug 998090: save file as doesn't remove entry from open file list.
            if (c.mFileName) {
                g.app.forgetOpenFile(c.mFileName);
            }
            // Don't change mFileName until the dialog has suceeded.
            c.mFileName = g.ensure_extension(fileName, g.defaultLeoFileExtension(c));
            // Part of the fix for https://bugs.launchpad.net/leo-editor/+bug/1194209

            // ? needed ?
            //c.frame.title = title = c.computeWindowTitle(c.mFileName)
            // c.frame.setTitle(title)

            // 2013/08/04: use c.computeWindowTitle.
            c.openDirectory = g.os_path_dirname(c.mFileName);
            c.frame.openDirectory = c.openDirectory;
            // Bug fix in 4.4b2.

            // Calls c.clearChanged() if no error.
            // ? needed ?
            // if( g.app.qt_use_tabs && c.frame['top']){
            //     c.frame.top.leo_master.setTabName(c, c.mFileName);
            // }
            (c.fileCommands as FileCommands).saveAs(c.mFileName);

            // ? needed ?
            //g.app.recentFilesManager.updateRecentFiles(c.mFileName);
            g.chdir(c.mFileName);
        }
        // Done in FileCommands.saveAs.
        // c.redraw_after_icons_changed()

        c.raise_error_dialogs('write');

        // ? needed ?
        // *Safely* restore focus, without using the old w directly.
        /*
        if inBody:
            c.bodyWantsFocus()
            p.restoreCursorAndScroll()
        else:
            c.treeWantsFocus()
        */
    }
    //@+node:felix.20220105210716.17: *4* c_file.saveTo
    @commander_command('save-to',
        'Save a Leo outline to a file, prompting for a new file name unless fileName is given.\n' +
        'Leave the file name of the Leo outline unchanged.'
    )
    @commander_command('file-save-to',
        'Save a Leo outline to a file, prompting for a new file name unless fileName is given.\n' +
        'Leave the file name of the Leo outline unchanged.'
    )
    @commander_command('save-file-to',
        'Save a Leo outline to a file, prompting for a new file name unless fileName is given.\n' +
        'Leave the file name of the Leo outline unchanged.'
    )
    public saveTo(this: Commands, fileName?: string, silent?: boolean): void {
        const c: Commands = this;
        let p: Position = this.p;

        // ? needed ?
        // Do this now: w may go away.
        /*
        w = g.app.gui.get_focus(c)
        inBody = g.app.gui.widget_name(w).startswith('body')
        if inBody:
            p.saveCursorAndScroll()
        */

        if (g.app.disableSave) {
            g.es("save commands disabled", "purple");
            return;
        }

        c.init_error_dialogs();
        // Add fileName keyword arg for leoBridge scripts.
        if (!fileName && c.k && c.k.givenArgs) {
            fileName = c.k.givenArgs.join('');
        }

        if (!fileName) {

            g.app.gui!.runSaveFileDialog(
                c,
                "Save To",
                [["Leo files", "*.leo *.db"]], // Array of arrays (one in this case)
                g.defaultLeoFileExtension(c)
            ).then((p_filename) => {
                if (p_filename) {
                    // re-start this 'save' method with given filename
                    c.saveTo(p_filename);
                }
            });
            return; // EXIT !
        }

        c.bringToFront();

        if (fileName) {
            (c.fileCommands as FileCommands).saveTo(fileName, silent);
            // ? needed ?
            // g.app.recentFilesManager.updateRecentFiles(fileName);
            g.chdir(fileName);
        }

        c.raise_error_dialogs('write');

        // ? needed ?
        // *Safely* restore focus, without using the old w directly.
        /*
        if inBody:
            c.bodyWantsFocus()
            p.restoreCursorAndScroll()
        else:
            c.treeWantsFocus()


        c.outerUpdate();
        */
    }
    //@+node:felix.20220105210716.18: *4* c_file.revert
    @commander_command(
        'revert',
        'Revert the contents of a Leo outline to last saved contents.'
    )
    public revert(this: Commands): void {

        const c: Commands = this;

        // Make sure the user wants to Revert.
        const fn: string = c.mFileName;
        if (!fn) {
            g.es('can not revert unnamed file.');
        }
        if (!g.os_path_exists(fn)) {
            g.es(`Can not revert unsaved file: ${fn}`);
            return;
        }

        g.app.gui!.runAskYesNoDialog(
            c,
            'Revert',
            `Revert to previous version of ${fn}?`
        ).then((p_reply) => {
            // c.bringToFront()
            if (p_reply === "yes") {
                g.app.loadManager!.revertCommander(c);
            }
        });
    }
    //@+node:felix.20220105210716.19: *4* c_file.save-as-leojs
    @commander_command(
        'file-save-as-leojs',
        'Save a Leo outline as a JSON (.leojs) file with a new file name.'
    )
    @commander_command(
        'save-file-as-leojs',
        'Save a Leo outline as a JSON (.leojs) file with a new file name.'
    )
    public save_as_leojs(this: Commands): void {

        const c: Commands = this;

        g.app.gui!.runSaveFileDialog(
            c,
            "Save As JSON (.leojs)",
            [["Leo files", "*.leojs"]],
            '.leojs'
        ).then((fileName) => {
            if (!fileName) {
                return;
            }
            if (!fileName.endsWith('.leojs')) {
                fileName = `${fileName}.leojs`;
            }
            // Leo 6.4: Using save-to instead of save-as allows two versions of the file.
            c.saveTo(fileName);
            (c.fileCommands as FileCommands).putSavedMessage(fileName);
        });

    }
    //@+node:felix.20220105210716.20: *4* c_file.save-as-zipped
    @commander_command(
        'file-save-as-zipped',
        'Save a Leo outline as a zipped (.db) file with a new file name.'
    )
    @commander_command(
        'save-file-as-zipped',
        'Save a Leo outline as a zipped (.db) file with a new file name.'
    )
    public save_as_zipped(this: Commands): void {

        const c: Commands = this;
        g.app.gui!.runSaveFileDialog(
            c,
            "Save As Zipped",
            [["Leo files", "*.db"]],
            '.db'
        ).then((fileName) => {
            if (!fileName) {
                return;
            }
            if (!fileName.endsWith('.db')) {
                fileName = `${fileName}.db`;
            }
            // Leo 6.4: Using save-to instead of save-as allows two versions of the file.
            c.saveTo(fileName);
            (c.fileCommands as FileCommands).putSavedMessage(fileName);
        });

    }
    //@+node:felix.20220105210716.21: *4* c_file.save-as-xml
    @commander_command(
        'file-save-as-xml',
        'Save a Leo outline as a .leo file with a new file name.\n' +
        'Useful for converting a .leo.db file to a .leo file.'
    )
    @commander_command(
        'save-file-as-xml',
        'Save a Leo outline as a .leo file with a new file name.\n' +
        'Useful for converting a .leo.db file to a .leo file.'
    )
    public save_as_xml(this: Commands): void {

        const c: Commands = this;

        g.app.gui!.runSaveFileDialog(
            c,
            "Save As XML",
            [["Leo files", "*.leo"]],
            g.defaultLeoFileExtension(c)
        ).then((fileName) => {
            if (!fileName) {
                return;
            }
            if (!fileName.endsWith('.leo')) {
                fileName = `${fileName}.leo`;
            }
            // Leo 6.4: Using save-to instead of save-as allows two versions of the file.
            c.saveTo(fileName);
            (c.fileCommands as FileCommands).putSavedMessage(fileName);
        });

    }
    //@+node:felix.20220105210716.22: *3* Export
    //@+node:felix.20220105210716.23: *4* c_file.exportHeadlines
    @commander_command(
        'export-headlines',
        'Export all headlines to an external file.'
    )
    public exportHeadlines(this: Commands): void {

        const c: Commands = this;

        const filetypes: [string, string][] = [["Text files", "*.txt"], ["All files", "*"]];

        g.app.gui!.runSaveFileDialog(
            c,
            "Export Headlines",
            filetypes,
            ".txt"
        ).then((fileName) => {
            c.bringToFront();
            if (fileName) {
                g.setGlobalOpenDir(fileName);
                g.chdir(fileName);
                c.importCommands.exportHeadlines(fileName);
            }
        });

    }
    //@+node:felix.20220105210716.24: *4* c_file.flattenOutline
    @commander_command(
        'flatten-outline',
        'Export the selected outline to an external file. The outline is represented in MORE format.'
    )
    public flattenOutline(this: Commands): void {

        const c: Commands = this;

        const filetypes: [string, string][] = [["Text files", "*.txt"], ["All files", "*"]];

        g.app.gui!.runSaveFileDialog(
            c,
            "Flatten Selected Outline",
            filetypes,
            ".txt"
        ).then((fileName) => {
            c.bringToFront();
            if (fileName) {
                g.setGlobalOpenDir(fileName);
                g.chdir(fileName);
                c.importCommands.flattenOutline(fileName);
            }
        });

    }
    //@+node:felix.20220105210716.25: *4* c_file.flattenOutlineToNode
    @commander_command(
        'flatten-outline-to-node',
        'Append the body text of all descendants of the selected node to the body text of the selected node.'
    )
    public flattenOutlineToNode(this: Commands): void {

        const c: Commands = this;
        const root: Position = this.p;
        const u: Undoer = this.undoer;

        if (!root.hasChildren()) {
            return;
        }

        const language: string = g.getLanguageAtPosition(c, root);

        let single: string;
        let start: string;
        let end: string;

        if (language) {
            [single, start, end] = g.set_delims_from_language(language);
        } else {
            [single, start, end] = ['#', "", ""];
        }
        const bunch: Bead = u.beforeChangeNodeContents(root);
        const aList: string[] = [];

        for (let p of root.subtree()) {
            if (single) {
                aList.push(`\n\n===== ${single} ${p.h}\n\n`);
            } else {
                aList.push(`\n\n===== ${start} ${p.h} ${end}\n\n`);
            }
            if (p.b.trim()) {
                const lines: string[] = g.splitLines(p.b);
                aList.push(...lines);
            }
        }

        root.b = root.b.trimEnd() + '\n' + aList.join('').trimEnd() + '\n';
        u.afterChangeNodeContents(root, 'flatten-outline-to-node', bunch);

    }
    //@+node:felix.20220105210716.26: *4* c_file.outlineToCWEB
    @commander_command(
        'outline-to-cweb',
        'Export the selected outline to an external file. The outline is represented in CWEB format.'
    )
    public outlineToCWEB(this: Commands): void {

        const c: Commands = this;

        const filetypes: [string, string][] = [
            ["CWEB files", "*.w"],
            ["Text files", "*.txt"],
            ["All files", "*"]
        ];

        g.app.gui!.runSaveFileDialog(
            c,
            "Outline To CWEB",
            filetypes,
            ".w"
        ).then((fileName) => {
            c.bringToFront();
            if (fileName) {
                g.setGlobalOpenDir(fileName);
                g.chdir(fileName);
                c.importCommands.outlineToWeb(fileName, "cweb");
            }
        });



    }
    //@+node:felix.20220105210716.27: *4* c_file.outlineToNoweb
    @commander_command(
        'outline-to-noweb',
        'Export the selected outline to an external file. The outline is represented in noweb format.'
    )
    public outlineToNoweb(this: Commands): void {

        const c: Commands = this;

        const filetypes: [string, string][] = [
            ["Noweb files", "*.nw"],
            ["Text files", "*.txt"],
            ["All files", "*"]
        ];

        g.app.gui!.runSaveFileDialog(
            c,
            "Outline To Noweb",
            filetypes,
            ".nw"
        ).then((fileName) => {
            c.bringToFront();
            if (fileName) {
                g.setGlobalOpenDir(fileName);
                g.chdir(fileName);
                c.importCommands.outlineToWeb(fileName, "noweb");
                c.outlineToNowebDefaultFileName = fileName;
            }
        });

    }
    //@+node:felix.20220105210716.28: *4* c_file.removeSentinels
    @commander_command(
        'remove-sentinels',
        'Import one or more files, removing any sentinels.'
    )
    public removeSentinels(this: Commands): void {

        const c: Commands = this;

        const types: [string, string][] = [
            ["All files", "*"],
            ["C/C++ files", "*.c"],
            ["C/C++ files", "*.cpp"],
            ["C/C++ files", "*.h"],
            ["C/C++ files", "*.hpp"],
            ["Java files", "*.java"],
            ["Lua files", "*.lua"],
            ["Pascal files", "*.pas"],
            ["Python files", "*.py"]
        ];

        g.app.gui!.runOpenFileDialog(c,
            "Remove Sentinels",
            types,
            ".py",
            true
        ).then((names) => {
            c.bringToFront();
            if (names && names.length) {
                g.chdir(names[0]);
                c.importCommands.removeSentinelsCommand(names);
            }
        });

    }
    //@+node:felix.20220105210716.29: *4* c_file.weave
    @commander_command(
        'weave',
        'Simulate a literate-programming weave operation by writing the outline to a text file.'
    )
    public weave(this: Commands): void {

        const c: Commands = this;

        g.app.gui!.runSaveFileDialog(
            c,
            "Weave",
            [["Text files", "*.txt"], ["All files", "*"]],
            ".txt"
        ).then((fileName) => {
            c.bringToFront();
            if (fileName) {
                g.setGlobalOpenDir(fileName);
                g.chdir(fileName);
                c.importCommands.weave(fileName);
            }
        });

    }
    //@+node:felix.20220105210716.30: *3* Read/Write
    //@+node:felix.20220105210716.31: *4* c_file.readAtAutoNodes
    @commander_command(
        'read-at-auto-nodes',
        'Read all @auto nodes in the presently selected outline.'
    )
    public readAtAutoNodes(this: Commands): void {
        const c: Commands = this;
        const p: Position = this.p;
        const u: Undoer = this.undoer;

        // c.endEditing();
        c.init_error_dialogs();
        const undoData: Bead = u.beforeChangeTree(p);
        c.importCommands.readAtAutoNodes();
        u.afterChangeTree(p, 'Read @auto Nodes', undoData);
        c.redraw();
        c.raise_error_dialogs('read');

    }
    //@+node:felix.20220105210716.32: *4* c_file.readAtFileNodes
    @commander_command(
        'read-at-file-nodes',
        'Read all @file nodes in the presently selected outline.'
    )
    public readAtFileNodes(this: Commands): void {
        const c: Commands = this;
        const p: Position = this.p;
        const u: Undoer = this.undoer;

        // c.endEditing();
        const undoData: Bead = u.beforeChangeTree(p);

        c.atFileCommands.readAllSelected(p);
        // Force an update of the body pane.
        c.setBodyString(p, p.b);  // Not a do-nothing!
        u.afterChangeTree(p, 'Read @file Nodes', undoData);
        c.redraw();
    }

    //@+node:felix.20220105210716.33: *4* c_file.readAtShadowNodes
    @commander_command(
        'read-at-shadow-nodes',
        'Read all @shadow nodes in the presently selected outline.'
    )
    public readAtShadowNodes(this: Commands): void {
        const c: Commands = this;
        const p: Position = this.p;
        const u: Undoer = this.undoer;

        // c.endEditing();
        c.init_error_dialogs();
        const undoData: Bead = u.beforeChangeTree(p);
        c.atFileCommands.readAtShadowNodes(p);
        u.afterChangeTree(p, 'Read @shadow Nodes', undoData);
        c.redraw();
        c.raise_error_dialogs('read');
    }
    //@+node:felix.20220105210716.34: *4* c_file.readFileIntoNode
    @commander_command(
        'read-file-into-node',
        'Read a file into a single node.'
    )
    public async readFileIntoNode(this: Commands): Promise<void> {
        const c: Commands = this;
        const undoType: string = 'Read File Into Node';

        // c.endEditing();
        const filetypes: [string, string][] = [["All files", "*"], ["Python files", "*.py"], ["Leo files", "*.leo"]];

        return g.app.gui!.runOpenFileDialog(
            c,
            "Read File Into Node",
            filetypes,
            ""
        ).then(async (fileName) => {
            if (!fileName.length) {
                return;
            }
            let s: string | undefined;
            let e: string | undefined;
            [s, e] = await g.readFileIntoString(fileName[0]);
            if (s === undefined) {
                return;
            }
            g.chdir(fileName[0]);
            s = '@nocolor\n' + s;
            // ? needed ?;
            // w = c.frame.body.wrapper;
            const p: Position = c.insertHeadline(undoType)!;
            p.setHeadString('@read-file-into-node ' + fileName[0]);
            p.setBodyString(s);
            // w.setAllText(s);
            c.redraw(p);
        });

    }
    //@+node:felix.20220105210716.35: *4* c_file.readOutlineOnly
    @commander_command(
        'read-outline-only',
        'Open a Leo outline from a .leo file, but do not read any derived files.'
    )
    public readOutlineOnly(this: Commands): void {
        const c: Commands = this;

        // c.endEditing();

        g.app.gui!.runOpenFileDialog(
            c,
            "Read Outline Only",
            [["Leo files", "*.leo"], ["All files", "*"]],
            ".leo"
        ).then((fileName) => {
            if (!fileName.length) {
                return;
            }
            try {
                // pylint: disable=assignment-from-no-return
                // Can't use 'with" because readOutlineOnly closes the file.

                // ! Replaced with vscode.workspace.fs !
                // const theFile: number = openSync(fileName[0], 'r');
                g.chdir(fileName[0]);
                const c: Commands = g.app.newCommander(fileName[0]);
                // ? needed ?
                //frame = c.frame;
                //frame.deiconify();
                //frame.lift();
                (c.fileCommands as FileCommands).readOutlineOnly(fileName[0]); // closes file.
            }
            catch (exception) {
                g.es("can not open:", fileName[0]);
            }
        });

    }
    //@+node:felix.20220105210716.36: *4* c_file.writeFileFromNode
    @commander_command(
        'write-file-from-node',
        'If node starts with @read-file-into-node, use the full path name ' +
        'in the headline.  Otherwise, prompt for a file name.'
    )
    public writeFileFromNode(this: Commands): Thenable<void> {

        const c: Commands = this;
        let p: Position = this.p;
        // c.endEditing();

        let h: string = p.h.trimEnd();
        let s: string = p.b;

        const tag: string = '@read-file-into-node';
        let fileName: string | undefined;

        if (h.startsWith(tag)) {
            fileName = h.slice(tag.length).trim();
        } else {
            fileName = undefined;
        }

        let q_fileName: Thenable<string>;

        if (!fileName) {
            q_fileName = g.app.gui!.runSaveFileDialog(
                c,
                'Write File From Node',
                [
                    ["All files", "*"],
                    ["Python files", "*.py"],
                    ["Leo files", "*.leo"]
                ],
                ""
            );
        } else {
            q_fileName = Promise.resolve(fileName);
        }

        return q_fileName.then((p_fileName) => {
            if (p_fileName) {
                try {
                    g.chdir(p_fileName);

                    if (s.startsWith('@nocolor\n')) {
                        s = s.slice('@nocolor\n'.length);
                    }

                    //fs.writeFileSync(p_fileName, s);
                    const w_uri = vscode.Uri.file(p_fileName);
                    const writeData = Buffer.from(s, 'utf8');
                    return vscode.workspace.fs.writeFile(w_uri, writeData);

                    // with open(p_fileName, 'w') as f:
                    //f.write(s);
                    //f.flush();

                    g.blue('wrote:', p_fileName);

                }
                catch (iOError) {
                    g.error('can not write %s', p_fileName);
                }
            }
        });

    }
    //@+node:felix.20220105210716.37: *3* Recent Files
    //@+node:felix.20220105210716.38: *4* c_file.cleanRecentFiles
    // ? unused ?
    // @commander_command('clean-recent-files')
    // def cleanRecentFiles(this: Commands)
    //     """
    //     Remove items from the recent files list that no longer exist.

    //     This almost never does anything because Leo's startup logic removes
    //     nonexistent files from the recent files list.
    //     """
    //     c = self
    //     g.app.recentFilesManager.cleanRecentFiles(c)
    //@+node:felix.20220105210716.39: *4* c_file.clearRecentFiles
    // ? unused ?
    // @commander_command('clear-recent-files')
    // def clearRecentFiles(this: Commands)
    //     """Clear the recent files list, then add the present file."""

    //@+node:felix.20220105210716.40: *4* c_file.editRecentFiles
    // ? unused ?
    // @commander_command('edit-recent-files')
    // def editRecentFiles(this: Commands)
    //     """Opens recent files list in a new node for editing."""
    //     c = self
    //     g.app.recentFilesManager.editRecentFiles(c)
    //@+node:felix.20220105210716.41: *4* c_file.openRecentFile
    // ? unused ?
    // @commander_command('open-recent-file')
    // def openRecentFile(self, event=None, fn=None):
    //     c = self
    //     // Automatically close the previous window if...
    //     closeFlag = (
    //         c.frame.startupWindow and
    //             // The window was open on startup
    //         not c.changed and not c.frame.saved and
    //             // The window has never been changed
    //         g.app.numberOfUntitledWindows == 1)
    //             // Only one untitled window has ever been opened.
    //     if g.doHook("recentfiles1", c=c, p=c.p, v=c.p, fileName=fn, closeFlag=closeFlag):
    //         return
    //     c2 = g.openWithFileName(fn, old_c=c)
    //     if c2:
    //         g.app.makeAllBindings()
    //     if closeFlag and c2 and c2 != c:
    //         g.app.destroyWindow(c.frame)
    //         c2.setLog()
    //         g.doHook("recentfiles2",
    //             c=c2, p=c2.p, v=c2.p, fileName=fn, closeFlag=closeFlag)
    //@+node:felix.20220105210716.42: *4* c_file.sortRecentFiles
    // ? unused ?
    // @commander_command('sort-recent-files')
    // def sortRecentFiles(this: Commands)
    //     """Sort the recent files list."""
    //     c = self
    //     g.app.recentFilesManager.sortRecentFiles(c)
    //@+node:felix.20220105210716.43: *4* c_file.writeEditedRecentFiles
    // ? unused ?
    // @commander_command('write-edited-recent-files')
    // def writeEditedRecentFiles(this: Commands)
    //     """
    //     Write content of "edit_headline" node as recentFiles and recreates
    //     menus.
    //     """
    //     c = self
    //     g.app.recentFilesManager.writeEditedRecentFiles(c)
    //@+node:felix.20220105210716.44: *3* Reference outline commands
    //@+node:felix.20220105210716.45: *4* c_file.updateRefLeoFile
    @commander_command(
        'update-ref-file',
        "Saves only the **public part** of this outline to the reference Leo\n" +
        "file. The public part consists of all nodes above the **special\n" +
        "separator node**, a top-level node whose headline is\n" +
        "`---begin-private-area---`.\n" +
        "\n" +
        "Below this special node is **private area** where one can freely make\n" +
        "changes that should not be copied (published) to the reference Leo file.\n" +
        "\n" +
        "**Note**: Use the set-reference-file command to create the separator node.\n"
    )
    public updateRefLeoFile(this: Commands): void {
        const c: Commands = this;
        (c.fileCommands as FileCommands).save_ref();
    }
    //@+node:felix.20220105210716.46: *4* c_file.readRefLeoFile
    @commander_command(
        'read-ref-file',
        "This command *completely replaces* the **public part** of this outline\n" +
        "with the contents of the reference Leo file. The public part consists\n" +
        "of all nodes above the top-level node whose headline is\n" +
        "`---begin-private-area---`.\n" +
        "\n" +
        "Below this special node is **private area** where one can freely make\n" +
        "changes that should not be copied (published) to the reference Leo file.\n" +
        "\n" +
        "**Note**: Use the set-reference-file command to create the separator node.\n"
    )
    public readRefLeoFile(this: Commands): void {
        const c: Commands = this;
        (c.fileCommands as FileCommands).updateFromRefFile();
    }
    //@+node:felix.20220105210716.47: *4* c_file.setReferenceFile
    @commander_command(
        'set-reference-file',
        'test'
        // "Shows a file open dialog allowing you to select a **reference** Leo\n" +
        // "document to which this outline will be connected.\n" +
        // "\n" +
        // "This command creates a **special separator node**, a top-level node\n" +
        // "whose headline is `---begin-private-area---` and whose body is the path\n" +
        // "to reference Leo file.\n" +
        // "\n" +
        // "The separator node splits the outline into two parts. The **public\n" +
        // "part** consists of all nodes above the separator node. The **private\n" +
        // "part** consists of all nodes below the separator node.\n" +
        // "\n" +
        // "The update-ref-file and read-ref-file commands operate on the **public\n" +
        // "part** of the outline. The update-ref-file command saves *only* the\n" +
        // "public part of the outline to reference Leo file. The read-ref-file\n" +
        // "command *completely replaces* the public part of the outline with the\n" +
        // "contents of reference Leo file.\n"
    )
    public setReferenceFile(this: Commands): void {

        const c: Commands = this;

        g.app.gui!.runOpenFileDialog(
            c,
            "Select reference Leo file",
            [["Leo files", "*.leo *.db"]],
            g.defaultLeoFileExtension(c)
        ).then((p_names) => {
            if (p_names && p_names.length) {
                (c.fileCommands as FileCommands).setReferenceFile(p_names[0]);
            }
        });

    }
    //@-others

}
//@-others
//@-leo
