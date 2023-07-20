//@+leo-ver=5-thin
//@+node:felix.20210102012410.1: * @file src/core/leoGlobals.ts
/**
 * Global constants, variables and utility functions used throughout Leo.
 * Important: This module imports no other Leo module.
 */
//@+<< imports >>
//@+node:felix.20210102181122.1: ** << imports >>
import * as vscode from 'vscode';
// import { Utils as uriUtils } from "vscode-uri";

// import * as Bowser from "bowser";
import * as os from 'os';
import * as safeJsonStringify from 'safe-json-stringify';
import * as path from 'path';
import { APIState, API, GitExtension, PublishEvent } from '../git';
import { LeoApp } from './leoApp';
import { Commands } from './leoCommands';
import { Position, VNode } from './leoNodes';
import { LeoGui } from './leoGui';

/*
    import binascii
    import codecs
    from functools import reduce/
    try:
        import gc
    catch ImportError:
        gc = None
    try:
        import gettext
    catch ImportError:  # does not exist in jython.
        gettext = None
    import glob
    import io
    StringIO = io.StringIO
    import importlib
    import inspect
    import operator
    import os
    #
    # Do NOT import pdb here!  We shall define pdb as a _function_ below.
    # import pdb
    import re
    import shlex
    import shutil
    import string
    import subprocess
    import tempfile
    import time
    import traceback
    import types
    import unittest
    import urllib
    import urllib.parse as urlparse
*/

//@-<< imports >>

// TODO: Maybe make those platform detection methods better with 'bowser' library
export const isBrowser: boolean = !!(process as any)?.browser; // coerced to boolean
export const isMac: boolean = process.platform?.startsWith('darwin');
export const isWindows: boolean = process.platform?.startsWith('win');

//@+<< define g.globalDirectiveList >>
//@+node:felix.20210102180402.1: ** << define g.globalDirectiveList >>
// Visible externally so plugins may add to the list of directives.
// The atFile write logic uses this, but not the atFile read logic.
export const globalDirectiveList: string[] = [
    // Order does not matter.
    'all',
    'beautify',
    'colorcache',
    'code',
    'color',
    'comment',
    'c',
    'delims',
    'doc',
    'encoding',
    // 'end_raw', // #2276.
    'first',
    'header',
    'ignore',
    'killbeautify',
    'killcolor',
    'language',
    'last',
    'lineending',
    'markup',
    'nobeautify',
    'nocolor-node',
    'nocolor',
    'noheader',
    'nowrap',
    'nopyflakes', // Leo 6.1.
    'nosearch', // Leo 5.3.
    'others',
    'pagewidth',
    'path',
    'quiet',
    // 'raw', // #2276.
    'section-delims', // Leo 6.6. #2276.
    'silent',
    'tabwidth',
    'unit',
    'verbose',
    'wrap',
];

export let directives_pat: RegExp; // Set below.

//@-<< define g.globalDirectiveList >>
//@+<< define global decorator dicts >>
//@+node:felix.20210102180405.1: ** << define global decorator dicts >>
/*
  The cmd_instance_dict supports per-class @cmd decorators. For example, the
  following appears in leo.commands.

      def cmd(name):
          """Command decorator for the abbrevCommands class."""
          return g.new_cmd_decorator(name, ['c', 'abbrevCommands',])

  For commands based on functions, use the @g.command decorator.
*/

export let global_commands_dict: {
    [key: string]: (
        ...args: any[]
    ) => any & { __doc__: string } & { __func_name__: string } & {
        __name__: string;
    } & { __ivars__: string[] };
};

export const cmd_instance_dict: { [key: string]: string[] } = {
    // Keys are class names, values are attribute chains.
    AbbrevCommandsClass: ['c', 'abbrevCommands'],
    AtFile: ['c', 'atFileCommands'],
    AutoCompleterClass: ['c', 'k', 'autoCompleter'],
    ChapterController: ['c', 'chapterController'],
    Commands: ['c'],
    ControlCommandsClass: ['c', 'controlCommands'],
    DebugCommandsClass: ['c', 'debugCommands'],
    EditCommandsClass: ['c', 'editCommands'],
    EditFileCommandsClass: ['c', 'editFileCommands'],
    FileCommands: ['c', 'fileCommands'],
    HelpCommandsClass: ['c', 'helpCommands'],
    KeyHandlerClass: ['c', 'k'],
    KeyHandlerCommandsClass: ['c', 'keyHandlerCommands'],
    KillBufferCommandsClass: ['c', 'killBufferCommands'],
    LeoApp: ['g', 'app'],
    LeoFind: ['c', 'findCommands'],
    LeoImportCommands: ['c', 'importCommands'],
    // 'MacroCommandsClass': ['c', 'macroCommands'],
    PrintingController: ['c', 'printingController'],
    RectangleCommandsClass: ['c', 'rectangleCommands'],
    RstCommands: ['c', 'rstCommands'],
    SpellCommandsClass: ['c', 'spellCommands'],
    Undoer: ['c', 'undoer'],
    VimCommands: ['c', 'vimCommands'],
};

//@-<< define global decorator dicts >>
//@+<< define g.Decorators >>
//@+node:felix.20211102223300.1: ** << define g.Decorators >>
// * Other Decorators used in leojs are in /src/core/decorators.ts

/**
 * Return the instance of c given by ivars.
 * ivars is a list of strings.
 * A special case: ivars may be 'g', indicating the leoGlobals module.
 */
export function ivars2instance(c: Commands, g: any, ivars: string[]): any {
    if (!ivars || !ivars.length) {
        g.trace('can not happen: no ivars');
        return undefined;
    }

    let ivar: string = ivars[0]; // first

    if (!['c', 'g'].includes(ivar)) {
        g.trace('can not happen: unknown base', ivar);
        return undefined;
    }

    let obj: any = ivar === 'c' ? c : g;

    // Dig in object
    for (let ivar of ivars.slice(1)) {
        obj = obj[ivar];
        if (!obj) {
            g.trace('can not happen: unknown attribute', obj, ivar, ivars);
            break;
        }
    }
    return obj;
}
//@-<< define g.Decorators >>
//@+<< define regex's >>
//@+node:felix.20210102180413.1: ** << define regex's >>
export const g_language_pat = new RegExp(/^@language\s+(\w+)+/, 'mg'); // Needs g flag for 'exec' in while loop
// Regex used by this module, and in leoColorizer.py.

// Patterns used only in this module...
export const g_is_directive_pattern = new RegExp(/^\s*@([\w-]+)\s*/);
// This pattern excludes @encoding.whatever and @encoding(whatever)
// It must allow @language python, @nocolor-node, etc.

// #2267: Support for @section-delims.
export const g_section_delims_pat = new RegExp(
    /^@section-delims[ \t]+([^ \w\n\t]+)[ \t]+([^ \w\n\t]+)[ \t]*$/,
    'm'
);

export const g_pos_pattern = new RegExp(/:(\d+),?(\d+)?,?([-\d]+)?,?(\d+)?$/);
export const g_tabwidth_pat = new RegExp(/(^@tabwidth)/, 'm');

export const color_directives_pat = new RegExp(
    /^@color|^@killcolor|^@nocolor-node|^@nocolor/,
    'mg'
);
//@-<< define regex's >>
//@+<< languages >>
//@+node:felix.20220112011241.1: ** << languages >>
const languagesList = [
    'actionscript',
    'ada95',
    'antlr',
    'apacheconf',
    'apdl',
    'applescript',
    'asp',
    'aspect-j',
    'assembly-macro32',
    'assembly-r2000',
    'assembly-parrot',
    'assembly-x86',
    'awk',
    'b',
    'batch',
    'bbj',
    'bcel',
    'beanshell',
    'bibtex',
    'c',
    'chill',
    'cil',
    'cobol',
    'coldfusion',
    'c++',
    'c#',
    'css',
    'cvs-commit',
    'd',
    'doxygen',
    'dsssl',
    'embperl',
    'erlang',
    'eiffel',
    'factor',
    'fortran',
    'fortran90',
    'foxpro',
    'freemarker',
    'gettext',
    'groovy',
    'haskell',
    'hex',
    'html',
    'i4gl',
    'icon',
    'idl',
    'inform',
    'inno-setup',
    'ini',
    'interlis',
    'io',
    'java',
    'javascript',
    'jcl',
    'jhtml',
    'jmk',
    'jsp',
    'lilypond',
    'lisp',
    'lotos',
    'lua',
    'mail',
    'makefile',
    'maple',
    'ml',
    'modula3',
    'moin',
    'mqsc',
    'netrexx',
    'nqc',
    'nsis2',
    'objective-c',
    'objectrexx',
    'occam',
    'omnimark',
    'pascal',
    'patch',
    'perl',
    'php',
    'pike',
    'pl-sql',
    'pl1',
    'pop11',
    'postscript',
    'powerdynamo',
    'povray',
    'prolog',
    'progress',
    'properties',
    'psp',
    'ptl',
    'pvwave',
    'pyrex',
    'python',
    'rebol',
    'redcode',
    'relax-ng-compact',
    'renderman-rib',
    'rest',
    'rhtml',
    'rpm-spec',
    'rtf',
    'ruby',
    'rview',
    's+',
    's#',
    'sas',
    'scheme',
    'sgml',
    'shellscript',
    'shtml',
    'smalltalk',
    'sdl/pr',
    'smi-mib',
    'sqr',
    'squidconf',
    'svn-commit',
    'swig',
    'tcl',
    'tex',
    'texinfo',
    'text',
    'tpl',
    'transact-sql',
    'uscript',
    'vbscript',
    'velocity',
    'verilog',
    'vhdl',
    'xml',
    'xsl',
    'zpt',
];
//@-<< languages >>

export const tree_popup_handlers: ((...args: any[]) => any)[] = []; // Set later.
export const user_dict: { [key: string]: any } = {}; // Non-persistent dictionary for free use

// The singleton app object. Was set by runLeo.py. Leojs sets it in the runLeo method of extension.ts.
export let app: LeoApp;

// The singleton Git extension exposed API
export let gitAPI: API;

// Global status vars.
export let inScript: boolean = false; // A synonym for app.inScript
export let unitTesting: boolean = false; // A synonym for app.unitTesting.

export let unicode_warnings: { [key: string]: any } = {}; // Keys are callers.

//@+others
//@+node:felix.20230413003654.1: ** g.codecs
export const codecs = {
    // UTF-8
    BOM_UTF8: new Uint8Array([0xef, 0xbb, 0xbf]),

    // UTF-16, little endian
    BOM_UTF16_LE: new Uint8Array([0xff, 0xfe]),

    // UTF-16, big endian
    BOM_UTF16_BE: new Uint8Array([0xfe, 0xff]),

    // UTF-32, little endian
    BOM_UTF32_LE: new Uint8Array([0xff, 0xfe, 0x00, 0x00]),

    // UTF-32, big endian
    BOM_UTF32_BE: new Uint8Array([0x00, 0x00, 0xfe, 0xff]),
};
//@+node:felix.20220213000430.1: ** g.Classes & class accessors
//@+node:felix.20220213000459.1: *3* class g.FileLikeObject (coreGlobals.py)
/**
 * Define a file-like object for redirecting writes to a string.
 * The caller is responsible for handling newlines correctly.
 */
export class FileLikeObject {
    public encoding: BufferEncoding;
    public ptr: number;
    private _list: string[];

    constructor(encoding: BufferEncoding = 'utf-8', fromString?: string) {
        this.encoding = encoding || 'utf-8';
        this._list = splitLines(fromString); // Must preserve newlines!
        this.ptr = 0;
    }

    //@+others
    //@+node:felix.20220213000459.2: *4* FileLikeObject.clear (coreGlobals.py)
    public clear(): void {
        this._list = [];
    }

    //@+node:felix.20220213000459.3: *4* FileLikeObject.close (coreGlobals.py)
    public close(): void {
        // pass
    }

    //@+node:felix.20220213000459.4: *4* FileLikeObject.flush (coreGlobals.py)
    public flush(): void {
        // pass
    }

    //@+node:felix.20220213000459.5: *4* FileLikeObject.get & getvalue & read (coreGlobals.py)
    public get(): string {
        return this._list.join('');
    }

    public getvalue(): string {
        return this.get();
    }

    public read(): string {
        return this.get();
    }

    //@+node:felix.20220213000459.6: *4* FileLikeObject.readline (coreGlobals.py)
    /**
     * Read the next line using at.list and at.ptr.
     */
    public readline(): string {
        if (this.ptr < this._list.length) {
            const line: string = this._list[this.ptr];
            this.ptr++;
            return line;
        }
        return '';
    }

    //@+node:felix.20220213000459.7: *4* FileLikeObject.write  (coreGlobals.py)
    public write(s: string): void {
        if (s) {
            this._list.push(s);
        }
    }

    //@-others
}

//@+node:felix.20221105181936.1: *3* class NullObject (Python Cookbook)
/**
 * An object that does nothing, and does it very well.
 * From the Python cookbook, recipe 5.23
 */
export class NullObject {
    // def __init__(self, *args, **keys): pass
    constructor(...args: any[]) {
        if (args) {
            // pass
        }
    }

    public toString(): string {
        return 'NullObject';
    }

    // def __call__(self, *args, **keys): return self

    // def __repr__(self): return "NullObject"

    // def __str__(self): return "NullObject"

    // def __bool__(self): return False

    // def __nonzero__(self): return 0

    // def __delattr__(self, attr): return self

    // def __getattr__(self, attr): return self

    // def __setattr__(self, attr, val): return self
}
//@+node:felix.20220213000607.1: *3* class g.GeneralSetting
// Important: The startup code uses this class,
// so it is convenient to define it in leoGlobals.py.

/**
 * A class representing any kind of setting except shortcuts.
 */
export class GeneralSetting {
    public kind: string;
    public encoding: BufferEncoding | undefined = undefined;
    public ivar: string | undefined = undefined;
    public source: string | undefined = undefined;
    public val: any | undefined = undefined;
    public path: string | undefined = undefined;
    public tag: string = 'setting';
    public unl: string | undefined = undefined;

    constructor(p_generalSetting: {
        kind: string;
        encoding?: BufferEncoding;
        ivar?: string;
        source?: string;
        val?: any;
        path?: string;
        tag?: string;
        unl?: string;
    }) {
        this.encoding = p_generalSetting.encoding;
        this.ivar = p_generalSetting.ivar;
        this.kind = p_generalSetting.kind;
        this.path = p_generalSetting.path;
        this.unl = p_generalSetting.unl;
        this.source = p_generalSetting.source;
        this.val = p_generalSetting.val;
        if (p_generalSetting.tag) {
            this.tag = p_generalSetting.tag;
        }
    }

    public __repr__(): string {
        // Better for g.printObj.
        let val;
        if (this.val) {
            val = this.val.toString().split('\n').join(' ');
        }
        return (
            // `GS: ${shortFileName(this.path)} ` +
            // `${this.kind} = ${val} `

            `GS: path: ${shortFileName(this.path || '')} ` +
            `source: ${this.source || ''} ` +
            `kind: ${this.kind} val: ${val}`
        );
    }
    public dump(): string {
        return this.__repr__();
    }

    // = () : trick for toString as per https://stackoverflow.com/a/35361695/920301
    public toString = (): string => {
        return this.__repr__();
    };
}
//@+node:felix.20220213000510.1: *3* class g.SettingsDict
/**
 * A subclass of dict providing settings-related methods.
 */
export class SettingsDict extends Map<string, any> {
    private _name: string;

    constructor(name: string) {
        super();
        this._name = name; // For __repr__ only.
    }

    //@+others
    //@+node:felix.20220213000510.2: *4* td.__repr__ & __str__
    // def __str__(self) -> str:
    //     """Concise: used by repr."""
    //     return (
    //         f"<TypedDict name:{self._name} "
    //         f"keys:{self.keyType.__name__} "
    //         f"values:{self.valType.__name__} "
    //         f"len(keys): {len(list(self.keys()))}>"
    //     )

    // def __repr__(self) -> str:
    //     """Suitable for g.printObj"""
    //     return f"{g.dictToString(self.d)}\n{str(self)}\n"

    // = () : trick for toString as per https://stackoverflow.com/a/35361695/920301
    public toString = (): string => {
        return `<SettingsDict name:${this._name} `;
    };

    //@+node:felix.20220628012349.1: *4* td.copy
    public copy(name?: string): SettingsDict {
        // The result is a g.SettingsDict.
        // return copy.deepcopy(self)
        const newDict = new SettingsDict(this._name);
        for (const p_key of this.keys()) {
            newDict.set(
                p_key,
                new GeneralSetting({
                    kind: this.get(p_key).kind,
                    encoding: this.get(p_key).encoding,
                    ivar: this.get(p_key).ivar,
                    source: this.get(p_key).source,
                    val: this.get(p_key).val,
                    path: this.get(p_key).path,
                    tag: this.get(p_key).tag,
                    unl: this.get(p_key).unl,
                })
            );
        }
        return newDict;
    }
    //@+node:felix.20220628014215.1: *4* td.get
    public override get(key: string, p_default?: any): any {
        if (this.has(key)) {
            return super.get(key);
        } else {
            return p_default;
        }
    }

    //@+node:felix.20220628012922.1: *4* td.update
    public update(d: SettingsDict): void {
        for (let key of d.keys()) {
            this.set(key, d.get(key));
        }
    }

    //@+node:felix.20220213000510.4: *4* td.add_to_list
    /**
     * Update the *list*, self.d [key]
     */
    public add_to_list(key: string, val: any): void {
        if (key === undefined) {
            trace('TypeDict: None is not a valid key', callers());
            return;
        }

        let aList: any[];
        aList = this.get(key);
        if (this.has(key)) {
            aList = this.get(key);
        } else {
            aList = [];
        }

        if (!aList.includes(val)) {
            aList.push(val);
            this.set(key, aList);
        }
    }

    //@+node:felix.20220213000510.8: *4* td.get_setting & get_string_setting
    /**
     * Return the canonical setting name.
     */
    public get_setting(key: string): any {
        key = key.split('-').join('');
        key = key.split('_').join('');

        const gs = this.get(key);
        const val = this.has(key) && gs.val;
        return val;
    }

    public get_string_setting(key: string): string | undefined {
        const val = this.get_setting(key);
        if (typeof val === 'string') {
            return val;
        } else {
            return undefined;
        }
    }

    //@+node:felix.20220213000510.9: *4* td.name & setName
    public name(): string {
        return this._name;
    }

    public setName(name: string): void {
        this._name = name;
    }

    //@-others
}

//@+node:felix.20221221003402.1: *3* g.isTextWrapper & isTextWidget
export function isTextWidget(w: any): boolean {
    return app.gui.isTextWidget(w);
}
export function isTextWrapper(w: any): boolean {
    return app.gui.isTextWrapper(w);
}
//@+node:felix.20211104210703.1: ** g.Debugging, GC, Stats & Timing
//@+node:felix.20211205233429.1: *3* g._assert
/**
 * A safer alternative to a bare assert.
 */
export function _assert(condition: any, show_callers: boolean = true): boolean {
    if (unitTesting) {
        console.assert(condition);
        return true;
    }
    const ok: boolean = Boolean(condition);
    if (ok) {
        return true;
    }
    es_print('\n===== g._assert failed =====\n');
    if (show_callers) {
        es_print(callers());
    }
    return false;
}
//@+node:felix.20211104212328.1: *3* g.caller
/**
 * Return the caller name i levels up the stack.
 */
export function caller(i: number = 1): string {
    return callers(i + 1).split(',')[0];
}

//@+node:felix.20211104212426.1: *3* g.callers
/**
 * Return a string containing a comma-separated list of the callers
 * of the function that called callerList.
 *
 * excludeCaller: True (the default), callers itself is not on the list.
 *
 * If the `verbose` keyword is True, return a list separated by newlines.
 */
export function callers(
    n: number = 4,
    count: number = 0,
    excludeCaller: boolean = true,
    verbose: boolean = false
): string {
    // Be careful to call _callerName with smaller values of i first:
    // sys._getframe throws ValueError if there are less than i entries.
    let result: string[] = [];
    let i: number = excludeCaller ? 3 : 2;
    while (1) {
        let s: string = _callerName(i, verbose);
        if (s) {
            result.push(s);
        }
        if (!s || result.length >= n) {
            break;
        }
        i += 1;
    }

    result.reverse();
    if (count > 0) {
        result = result.slice(0, count);
    }
    // if (verbose) {
    // return ''; //''.join([f"\n  {z}" for z in result]);
    // }
    return result.join(',');
}

//@+node:felix.20211104212435.1: *3* g._callerName
export function _callerName(n: number, verbose: boolean = false): string {
    // TODO : see Error().stack to access names from the call stack
    // return Error.stack.split()[n]; // or something close to that
    return '<_callerName>';
}

//@+node:felix.20211104220458.1: *3* g.get_line & get_line__after
// Very useful for tracing.

export function get_line(s: string, i: number): string {
    let nl = '';
    if (is_nl(s, i)) {
        i = skip_nl(s, i);
        nl = '[nl]';
    }
    const j: number = find_line_start(s, i);
    const k: number = skip_to_end_of_line(s, i);
    return nl + s.substring(j, k);
}

// Important: getLine is a completely different function.
// * getLine != get_line !!

export function get_line_after(s: string, i: number): string {
    let nl = '';
    if (is_nl(s, i)) {
        i = skip_nl(s, i);
        nl = '[nl]';
    }
    const k: number = skip_to_end_of_line(s, i);
    return nl + s.substring(i, k);
}

// getLineAfter = get_line_after
export const getLineAfter = get_line_after;

//@+node:felix.20230423224653.1: *3* g.getIvarsDict and checkUnchangedIvars
/**
 * Return a dictionary of ivars:values for non-methods of obj.
 */
export function getIvarsDict(obj: any): { [key: string]: any } {
    const d: { [key: string]: any } = {};

    //    [[key, getattr(obj, key)] for key in dir(obj)
    // if not isinstance(getattr(obj, key), types.MethodType)])
    for (const key in obj) {
        // console.log(key); // prints 'a', 'b', and 'c'
        const w_callable =
            typeof obj[key] === 'function' || obj[key] instanceof Function;
        if (!w_callable) {
            d[key] = obj[key];
        }
    }
    return d;
}

export function checkUnchangedIvars(
    obj: any,
    d: { [key: string]: any },
    exceptions?: string[]
): boolean {
    if (!exceptions || !exceptions.length) {
        exceptions = [];
    }
    let ok = true;
    for (const key in d) {
        // USE 'IN' FOR KEY!
        if (!exceptions.includes(key)) {
            if (obj[key] !== d[key]) {
                trace(
                    `changed ivar: ${key} ` +
                    `old: ${d[key]} ` +
                    `new: ${obj[key]}`
                );
                ok = false;
            }
        }
    }
    return ok;
}
//@+node:felix.20211104221354.1: *3* g.listToString     (coreGlobals.py)
/**
 * Pretty print any array / python list to string
 */
export function listToString(obj: any): string {
    // return JSON.stringify(obj, undefined, 4);
    let result: string = '';

    result = obj.toString(); // TODO : TEST THIS!
    // result = safeJsonStringify(obj, null, 2);// TODO : TEST THIS!

    // let cache: any[] = [];
    // result = JSON.stringify(obj, function (key, value) {
    //     if (typeof value === 'object' && value !== null) {
    //         if (cache!.indexOf(value) !== -1) {
    //             // Circular reference found, discard key
    //             return;
    //         }
    //         // Store value in our collection
    //         cache!.push(value);
    //     }
    //     return value;
    // });
    // (cache as any) = null; // Enable garbage collection

    return result;
}

//@+node:felix.20211104221420.1: *3* g.objToSTring     (coreGlobals.py)
/**
 * Pretty print any object to a string.
 */
export function objToString(obj: any, tag?: string): string {
    let result: string = '';
    if (tag) {
        result = result + `${tag}...` + '\n';
    }
    result = result + safeJsonStringify(obj, null, 2);

    return result;

    /*
    if isinstance(obj, dict):
        result_list = ['{\n']
        pad = max([len(key) for key in obj])
        for key in sorted(obj):
            pad_s = ' ' * max(0, pad - len(key))
            result_list.append(f"  {pad_s}{key}: {obj.get(key)}\n")
        result_list.append('}')
        result = ''.join(result_list)
    elif isinstance(obj, (list, tuple)):
        # Return the enumerated lines of the list.
        result_list = ['[\n' if isinstance(obj, list) else '(\n']
        for i, z in enumerate(obj):
            result_list.append(f"  {i:4}: {z!r}\n")
        result_list.append(']\n' if isinstance(obj, list) else ')\n')
        result = ''.join(result_list)
    elif not isinstance(obj, str):
        result = pprint.pformat(obj, indent=indent, width=width)
        # Put opening/closing delims on separate lines.
        if result.count('\n') > 0 and result[0] in '([{' and result[-1] in ')]}':
            result = f"{result[0]}\n{result[1:-2]}\n{result[-1]}"
    elif '\n' not in obj:
        result = repr(obj)
    else:
        # Return the enumerated lines of the string.
        lines = ''.join([
            f"  {i:4}: {z!r}\n" for i, z in enumerate(g.splitLines(obj))
        ])
        result = f"[\n{lines}]\n"
    return f"{tag.strip()}: {result}" if tag and tag.strip() else result
    */

}

//@+node:felix.20211104221444.1: *3* g.printObj        (coreGlobals.py)
/**
 * Pretty print any Python object using pr.
 */
export function printObj(
    obj: any,
    indent = '',
    printCaller = false,
    tag?: string
): void {
    // TODO : Replace with output to proper pr function
    //     pr(objToString(obj, indent=indent, printCaller=printCaller, tag=tag))
    pr(obj);
}

//@+node:felix.20211104210724.1: ** g.Directives
//@+node:felix.20220410000509.1: *3* g.comment_delims_from_extension
/**
 * Return the comment delims corresponding to the filename's extension.
 */
export function comment_delims_from_extension(
    filename: string
): [string, string, string] {
    let root;
    let ext;

    if (filename.startsWith('.')) {
        ext = filename;
    } else {
        ext = path.extname(filename);
    }
    if (ext === '.tmp') {
        root = filename.slice(0, -4);
        ext = path.extname(root);
    }

    let language = app.extension_dict[ext.substring(1)];

    if (ext) {
        return set_delims_from_language(language);
    }

    trace(
        `unknown extension: {ext!r},` +
        `filename: {filename!r},` +
        `root: {root!r}`
    );

    return ['', '', ''];
}

//@+node:felix.20220111004937.1: *3* g.findAllValidLanguageDirectives
/**
 * Return list of all languages for which there is a valid @language
 * directive in s.
 */
export function findAllValidLanguageDirectives(s: string): string[] {
    if (!s.trim()) {
        return [];
    }
    const languages: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = g_language_pat.exec(s)) !== null) {
        const language: string = m[1];
        if (isValidLanguage(language)) {
            languages.push(language);
        }
    }
    return languages.sort();
}
//@+node:felix.20220112011652.1: *3* g.findFirstAtLanguageDirective
/**
 * Return the first language for which there is a valid @language
 * directive in s.
 */
export function findFirstValidAtLanguageDirective(
    s: string
): string | undefined {
    if (!s.trim()) {
        return undefined;
    }
    let language: string;
    let m: any;
    while ((m = g_language_pat.exec(s)) !== null) {
        language = m[1];
        if (isValidLanguage(language)) {
            return language;
        }
    }
    return undefined;
}
//@+node:felix.20230423231138.1: *3* g.findReference
/**
 * Return the position containing the section definition for name.
 *
 * Called from the syntax coloring method that colorizes section references.
 * Also called from write at.putRefAt.
 */
export function findReference(
    name: string,
    root: Position
): Position | undefined {
    for (const p of root.subtree(false)) {
        console.assert(!p.__eq__(root));
        if (p.matchHeadline(name) && !p.isAtIgnoreNode()) {
            return p.copy();
        }
    }
    return undefined;
}
//@+node:felix.20211104213229.1: *3* g.get_directives_dict (must be fast)
/**
 *  Scan p for Leo directives found in globalDirectiveList.
 *
 * Returns a dict containing the stripped remainder of the line
 * following the first occurrence of each recognized directive.
 */
export function get_directives_dict(p: Position): { [key: string]: string } {
    let d: { [key: string]: string } = {};

    // The headline has higher precedence because it is more visible.
    let m: RegExpExecArray | null;
    for (let s of [p.h, p.b]) {
        while ((m = directives_pat.exec(s)) !== null) {
            const word: string = m[1].trim();

            // 'indices' property is only present when the d flag is set.
            const i: number = (m as any).indices[1][0];
            if (d[word]) {
                continue;
            }
            const j: number = i + word.length;
            if (j < s.length && !' \t\n'.includes(s.charAt(j))) {
                continue;
            }

            // Not a valid directive: just ignore it.
            // A unit test tests that @path:any is invalid.
            const k: number = skip_line(s, j);
            const val: string = s.slice(j, k).trim();
            d[word] = val;
        }
    }

    return d;
}
//@+node:felix.20211104213315.1: *3* g.get_directives_dict_list (must be fast)
/**
 * Scans p and all its ancestors for directives.
 *
 * Returns a list of dicts containing pointers to
 * the start of each directive
 */
export function get_directives_dict_list(
    p: Position
): { [key: string]: string }[] {
    const result: { [key: string]: string }[] = [];
    const p1: Position = p.copy();
    for (let p of p1.self_and_parents(false)) {
        // No copy necessary: g.get_directives_dict does not change p.
        result.push(get_directives_dict(p));
    }
    return result;
}
//@+node:felix.20220110224107.1: *3* g.getLanguageFromAncestorAtFileNode
/**
 * Return the language in effect at node p.
 *
 * 1. Use an unambiguous @language directive in p itself.
 * 2. Search p's "extended parents" for an @<file> node.
 * 3. Search p's "extended parents" for an unambiguous @language directive.
 */
export function getLanguageFromAncestorAtFileNode(
    p: Position
): string | undefined {
    const v0: VNode = p.v;

    // The same generator as in v.setAllAncestorAtFileNodesDirty.
    // Original idea by Виталије Милошевић (Vitalije Milosevic).
    // Modified by EKR.
    let seen: VNode[] = [];

    function* v_and_parents(v: VNode): Generator<VNode> {
        if (seen.indexOf(v) < 0) {
            seen.push(v); // not found, add it
        } else {
            return;
        }
        yield v;
        for (let parent_v of v.parents) {
            if (seen.indexOf(parent_v) < 0) {
                yield* v_and_parents(parent_v); // was  not found
            }
        }
    }
    /**
     * A helper for all searches.
     * Phase one searches only @<file> nodes.
     */
    function find_language(v: VNode, phase: number): string | undefined {
        if (phase === 1 && !v.isAnyAtFileNode()) {
            return undefined;
        }
        let w_language: string;
        // #1693: Scan v.b for an *unambiguous* @language directive.
        const languages: string[] = findAllValidLanguageDirectives(v.b);
        if (languages.length === 1) {
            // An unambiguous language
            return languages[0];
        }
        let name: string;
        let junk: string;
        let ext: string;
        if (v.isAnyAtFileNode()) {
            // Use the file's extension.
            name = v.anyAtFileNodeName();
            [junk, ext] = os_path_splitext(name);
            ext = ext.slice(1); // strip the leading period.
            w_language = app.extension_dict[ext];

            if (isValidLanguage(w_language)) {
                return w_language;
            }
        }
        return undefined;
    }

    // First, see if p contains any @language directive.
    let language = findFirstValidAtLanguageDirective(p.b);
    if (language) {
        return language;
    }
    // Phase 1: search only @<file> nodes: #2308.
    // Phase 2: search all nodes.
    for (let phase of [1, 2]) {
        // Search direct parents.
        for (let p2 of p.self_and_parents(false)) {
            language = find_language(p2.v, phase);
            if (language) {
                return language;
            }
        }
        // Search all extended parents.
        seen = [v0.context.hiddenRootNode];
        for (let v of v_and_parents(v0)) {
            language = find_language(v, phase);
            if (language) {
                return language;
            }
        }
    }
    return undefined;
}
//@+node:felix.20220110224044.1: *3* g.getLanguageFromPosition
/**
 * Return the language in effect at position p.
 * This is always a lowercase language name, never None.
 */
export function getLanguageAtPosition(c: Commands, p: Position): string {
    const aList: { [key: string]: string }[] = get_directives_dict_list(p);
    const d: { [key: string]: any } | undefined =
        scanAtCommentAndAtLanguageDirectives(aList);
    let language: string =
        (d && d['language']) ||
        getLanguageFromAncestorAtFileNode(p) ||
        c.config.getString('target-language') ||
        'python';

    return language.toLowerCase();
}
//@+node:felix.20220412235837.1: *3* g.getOutputNewline
/**
 * Convert the name of a line ending to the line ending itself.
 *
 * Priority:
 * - Use name if name given
 * - Use c.config.output_newline if c given,
 * - Otherwise use g.app.config.output_newline.
 */
export function getOutputNewline(
    c: Commands | undefined,
    name?: string
): string {
    let s: string;
    if (name) {
        s = name;
    } else if (c) {
        s = c.config.getString('output-newline');
    } else {
        s = 'nl'; // Legacy value. Perhaps dubious.
    }
    if (!s) {
        s = '';
    }

    s = s.toLowerCase();

    if (['nl', 'lf'].includes(s)) {
        s = '\n';
    } else if (s === 'cr') {
        s = '\r';
    } else if (s === 'platform') {
        s = os.EOL; // 12/2/03 emakital
    } else if (s === 'crlf') {
        s = '\r\n';
    } else {
        s = '\n'; // Default for erroneous values.
    }
    console.assert(
        typeof s === 'string' || (s as any) instanceof String,
        s.toString()
    );

    return s;
}
//@+node:felix.20221020012052.1: *3* g.inAtNosearch
/**
 * Return True if p or p's ancestors contain an @nosearch directive.
 */
export function inAtNosearch(p?: Position): boolean {
    if (!p || !p.__bool__()) {
        return false; // #2288.
    }
    for (let p_p of p.self_and_parents()) {
        const nosearch = p_p.b.search(/(^@|\n@)nosearch\b/) !== -1;
        const ignored = p_p.is_at_ignore();
        if (ignored || nosearch) {
            return true;
        }
    }
    return false;
}
//@+node:felix.20211104213330.1: *3* g.isDirective
/**
 * Return True if s starts with a directive.
 */
export function isDirective(s: string): boolean {
    const m: RegExpExecArray | null = g_is_directive_pattern.exec(s);
    if (m) {
        // This pattern excludes @encoding.whatever and @encoding(whatever)
        // It must allow @language python, @nocolor-node, etc.
        const s2: string = s.substring(m.index + m[0].length); // text from end of match #1 (the word after @)
        if (s2 && '.('.includes(s2.charAt(0))) {
            return false;
        }
        return globalDirectiveList.includes(m[1]);
    }
    return false;
}

//@+node:felix.20220112002732.1: *3* g.isValidLanguage
/**
 * True if the given language may be used as an external file.
 */
export function isValidLanguage(language: string): boolean {
    return !!(language && app.language_delims_dict[language]);
}
//@+node:felix.20220110224137.1: *3* g.scanAtCommentAndLanguageDirectives
/**
 * Scan aList for @comment and @language directives.
 * @comment should follow @language if both appear in the same node.
 */
export function scanAtCommentAndAtLanguageDirectives(
    aList: { [key: string]: string }[]
):
    | {
        language: string;
        comment: string;
        delims: [string, string, string];
    }
    | undefined {
    let lang: string | undefined = undefined;
    for (let d of aList) {
        const comment: string = d['comment'];
        const language: string = d['language'];
        // Important: assume @comment follows @language.
        let delim1: string | undefined;
        let delim2: string | undefined;
        let delim3: string | undefined;
        if (language) {
            [lang, delim1, delim2, delim3] = set_language(language, 0);
        }
        if (comment) {
            [delim1, delim2, delim3] = set_delims_from_string(comment);
        }
        if (comment || language) {
            const delims: [string, string, string] = [
                delim1!,
                delim2!,
                delim3!,
            ];
            const w_d = { language: lang!, comment: comment, delims: delims };
            return w_d;
        }
    }
    return undefined;
}
//@+node:felix.20221220000621.1: *3* g.scanAtEncodingDirectives
/**
 * Scan aList for @encoding directives.
 */
export function scanAtEncodingDirectives(
    aList: any[]
): BufferEncoding | undefined {
    for (let d of aList) {
        const encoding = d['encoding'] as BufferEncoding | undefined;
        if (encoding && isValidEncoding(encoding)) {
            return encoding;
        }
        if (encoding && !unitTesting) {
            error('invalid @encoding:', encoding);
        }
    }
    return undefined;
}
//@+node:felix.20220412232541.1: *3* g.scanAtHeaderDirectives
/**
 * scan aList for @header and @noheader directives.
 * @param aList
 */
export function scanAtHeaderDirectives(aList: any[]): void {
    for (let d of aList) {
        if (d['header'] && d['noheader']) {
            error('conflicting @header and @noheader directives');
        }
    }
}
//@+node:felix.20220412232548.1: *3* g.scanAtLineendingDirectives
/**
 * Scan aList for @lineending directives.
 * @param aList
 */
export function scanAtLineendingDirectives(aList: any[]): string | undefined {
    for (let d of aList) {
        const e = d['lineending'];
        if (['cr', 'crlf', 'lf', 'nl', 'platform'].includes(e)) {
            const lineending = getOutputNewline(undefined, e);
            return lineending;
        }
        // else:
        // g.error("invalid @lineending directive:",e)
    }
    return undefined;
}
//@+node:felix.20220412232628.1: *3* g.scanAtPagewidthDirectives
/**
 * Scan aList for @pagewidth directives.
 * @param aList
 * @param issue_error_flag
 */
export function scanAtPagewidthDirectives(
    aList: any[],
    issue_error_flag?: boolean
): number | undefined {
    for (let d of aList) {
        const s = d['pagewidth'];
        if (s && s !== '') {
            let i;
            let val;
            [i, val] = skip_long(s, 0);
            if (val && val > 0) {
                return val;
            }
            if (issue_error_flag && !unitTesting) {
                error('ignoring @pagewidth', s);
            }
        }
    }
    return undefined;
}
//@+node:felix.20211104225158.1: *3* g.scanAtTabwidthDirectives & scanAllTabWidthDirectives
/**
 * Scan aList for '@tabwidth' directives.
 */
export function scanAtTabwidthDirectives(
    aList: any[],
    issue_error_flag = false
): number | undefined {
    for (let d of aList) {
        const s: string = d['tabwidth'];
        if (s || s === '') {
            const w_skip_long = skip_long(s, 0);
            const val: number | undefined = w_skip_long[1];

            if (val) {
                return val;
            }
            if (issue_error_flag && !unitTesting) {
                error('ignoring @tabwidth', s);
            }
        }
    }
    return undefined;
}

/**
 * Scan p and all ancestors looking for '@tabwidth' directives.
 */
export function scanAllAtTabWidthDirectives(
    c: Commands,
    p?: Position
): number | undefined {
    let ret: number | undefined;
    if (c && p && p.__bool__()) {
        const aList: any[] = get_directives_dict_list(p);
        let val: number | undefined = scanAtTabwidthDirectives(aList);
        ret = val === undefined ? c.tab_width : val;
    } else {
        ret = undefined;
    }
    return ret;
}
//@+node:felix.20220412232655.1: *3* g.scanAtWrapDirectives
/**
 * Scan aList for @wrap and @nowrap directives.
 * @param aList
 * @param issue_error_flag
 */
export function scanAtWrapDirectives(
    aList: any[],
    issue_error_flag?: boolean
): boolean | undefined {
    for (let d of aList) {
        const dWrap = d['wrap'];
        const dNoWrap = d['nowrap'];
        if (dWrap !== undefined) {
            return true;
        }
        if (dNoWrap !== undefined) {
            return false;
        }
    }
    return undefined;
}

/**
 * Scan p and all ancestors looking for @wrap/@nowrap directives.
 * @param aList
 * @param issue_error_flag
 */
export function scanAllAtWrapDirectives(
    c: Commands,
    p: Position
): boolean | undefined {
    let ret: boolean | undefined;

    if (c && p && p.__bool__()) {
        const w_default = !!(c && c.config.getBool('body-pane-wraps'));
        const aList = get_directives_dict_list(p);
        const val = scanAtWrapDirectives(aList);
        ret = val === undefined ? w_default : val;
    }

    return ret;
}
//@+node:felix.20221219221446.1: *3* g.scanForAtLanguage
/**
 * Scan position p and p's ancestors looking only for @language and @ignore directives.
 *
 * Returns the language found, or c.target_language.
 */
export function scanForAtLanguage(
    c: Commands,
    p: Position
): string | undefined {
    // Unlike the code in x.scanAllDirectives, this code ignores @comment directives.
    if (c && p && p.__bool__()) {
        for (let w_p of p.self_and_parents(false)) {
            const d = get_directives_dict(w_p);
            if (d['language']) {
                const z = d['language'];
                let language;
                let delim1;
                let delim2;
                let delim3;
                [language, delim1, delim2, delim3] = set_language(z, 0);
                return language;
            }
        }
    }
    return c.target_language;
}
//@+node:felix.20220110202727.1: *3* g.set_delims_from_language
/**
 * Return a tuple (single,start,end) of comment delims.
 */
export function set_delims_from_language(
    language: string
): [string, string, string] {
    const val = app.language_delims_dict[language];
    let delim1: string | undefined;
    let delim2: string | undefined;
    let delim3: string | undefined;
    if (val) {
        [delim1, delim2, delim3] = set_delims_from_string(val);
        if (delim2 && !delim3) {
            return ['', delim1!, delim2];
            // 0,1 or 3 params.
        }
        return [delim1!, delim2!, delim3!];
    }
    return ['', '', ''];
    // Indicate that no change should be made
}
//@+node:felix.20220110202842.1: *3* g.set_delims_from_string
/**
 * Return (delim1, delim2, delim2), the delims following the @comment
 * directive.
 *
 * This code can be called from @language logic, in which case s can
 * point at @comment
 */
export function set_delims_from_string(
    s: string
): [string, string, string] | [undefined, undefined, undefined] {
    // Skip an optional @comment
    const tag: string = '@comment';
    let i: number = 0;
    let j: number;

    if (match_word(s, i, tag)) {
        i += tag.length;
    }

    let count: number = 0;
    const delims: [string, string, string] = ['', '', ''];

    while (count < 3 && i < s.length) {
        i = skip_ws(s, i);
        j = i;
        while (i < s.length && !is_ws(s[i]) && !is_nl(s, i)) {
            i += 1;
        }
        if (j === i) {
            break;
        }
        delims[count] = s.slice(j, i) || '';
        count += 1;
    }

    // 'rr 09/25/02
    if (count === 2) {
        // delims[0] is always the single-line delim.
        delims[2] = delims[1];
        delims[1] = delims[0];
        delims[0] = '';
    }

    for (let i of [0, 1, 2]) {
        if (delims[i]) {
            if (delims[i].startsWith('@0x')) {
                // Allow delimiter definition as @0x + hexadecimal encoded delimiter
                // to avoid problems with duplicate delimiters on the @comment line.
                // If used, whole delimiter must be encoded.
                if (delims[i].length === 3) {
                    warning(`'${delims[i]}' delimiter is invalid`);
                    return [undefined, undefined, undefined];
                }
                try {
                    // ! TEST THIS !
                    // delims[i] = binascii.unhexlify(delims[i].splice(3)); // type:ignore
                    delims[i] = String.fromCharCode(
                        parseInt(delims[i].slice(3), 16)
                    );
                    delims[i] = toUnicode(delims[i]);
                } catch (e) {
                    warning(`'${delims[i]}' delimiter is invalid: ${e} `);
                    return [undefined, undefined, undefined];
                }
            } else {
                // 7/8/02: The "REM hack": replace underscores by blanks.
                // 9/25/02: The "perlpod hack": replace double underscores by newlines.
                delims[i] = delims[i].split('__').join('\n');
                delims[i] = delims[i].split('_').join(' ');
            }
        }
    }

    return [delims[0], delims[1], delims[2]];
}
//@+node:felix.20220110231927.1: *3* g.set_language
/**
 * Scan the @language directive that appears at s[i:].
 *
 * The @language may have been stripped away.
 *
 * Returns (language, delim1, delim2, delim3)
 */
export function set_language(
    s: string,
    i: number,
    issue_errors_flag?: boolean
):
    | [string, string, string, string]
    | [undefined, undefined, undefined, undefined] {
    let j: number;
    const tag: string = '@language';
    console.assert(i !== undefined);

    if (match_word(s, i, tag)) {
        i += tag.length;
    }
    // Get the argument.
    i = skip_ws(s, i);
    j = i;
    i = skip_c_id(s, i);
    // Allow tcl/tk.
    const arg: string = s.slice(j, i).toLowerCase();

    let delim1: string;
    let delim2: string;
    let delim3: string;
    if (app.language_delims_dict[arg]) {
        let language = arg;
        [delim1, delim2, delim3] = set_delims_from_language(language);
        return [language, delim1, delim2, delim3];
    }
    if (issue_errors_flag) {
        es('ignoring:', get_line(s, i));
    }
    return [undefined, undefined, undefined, undefined];
}
//@+node:felix.20220102155326.1: *3* g.stripPathCruft
/**
 * Strip cruft from a path name.
 */
export function stripPathCruft(p_path: string): string {
    if (!p_path) {
        return p_path; // Retain empty paths for warnings.
    }
    if (
        p_path.length > 2 &&
        ((p_path[0] === '<' && p_path[p_path.length - 1] === '>') ||
            (p_path[0] === '"' && p_path[p_path.length - 1] === '"') ||
            (p_path[0] === "'" && p_path[p_path.length - 1] === "'"))
    ) {
        p_path = p_path.substring(1, p_path.length - 1).trim();
    }
    // We want a *relative* path, not an absolute path.
    return p_path;
}
//@+node:felix.20211104233842.1: *3* g.update_directives_pat (new)
/**
 * Init/update g.directives_pat
 */
export function update_directives_pat(): void {
    // global globalDirectiveList, directives_pat
    // Use a pattern that guarantees word matches.

    const aList: string[] = [];

    // aList = [
    //     fr"\b{z}\b" for z in globalDirectiveList if z != 'others'
    // ]

    // The metacharacter \b is an anchor like the caret and the dollar sign.
    // It matches at “word boundary” positions. This match is zero-length.
    for (let z of globalDirectiveList) {
        if (z !== 'others') {
            aList.push('\\b' + z + '\\b');
        }
    }

    // pat = "^@(%s)" % "|".join(aList)
    const pat: string = '^@(' + aList.join('|') + ')';

    // directives_pat = re.compile(pat, re.MULTILINE)
    directives_pat = new RegExp(pat, 'mdg');
}
// #1688: Initialize g.directives_pat
update_directives_pat();
//@+node:felix.20211104210746.1: ** g.Files & Directories
//@+node:felix.20220108221428.1: *3* g.chdir
export async function chdir(p_path: string): Promise<void> {
    let w_isDir = await os_path_isdir(p_path);
    if (w_isDir) {
        p_path = os_path_dirname(p_path);
    }

    w_isDir = await os_path_isdir(p_path);
    const w_exist = await os_path_exists(p_path);

    if (w_isDir && w_exist) {
        process.chdir(p_path);
    }
}
//@+node:felix.20230711213447.1: *3* g.mkdir
export async function mkdir(folderName: string): Promise<void> {
    const w_uri = makeVscodeUri(folderName);
    await vscode.workspace.fs.createDirectory(w_uri);
}
//@+node:felix.20230714230415.1: *3* g.rmdir
export async function rmdir(folderName: string): Promise<void> {
    const w_uri = makeVscodeUri(folderName);
    await vscode.workspace.fs.delete(w_uri, { recursive: true });
}
//@+node:felix.20220511212935.1: *3* g.computeWindowTitle
export function computeWindowTitle(fileName: string): string {
    let branch;
    let commit;
    [branch, commit] = gitInfoForFile(fileName); // #1616
    if (!fileName) {
        return branch ? branch + ': untitled' : 'untitled';
    }
    let w_path;
    let fn;
    let title;
    [w_path, fn] = os_path_split(fileName);
    if (w_path) {
        title = fn + ' in ' + w_path;
    } else {
        title = fn;
    }
    // Yet another fix for bug 1194209: regularize slashes.
    if ('/\\'.includes(path.sep)) {
        title = title.replace(/\//g, path.sep).replace(/\\/g, path.sep);
    }
    if (branch) {
        title = branch + ': ' + title;
    }
    return title;
}
//@+node:felix.20230712232252.1: *3* g.createHiddenCommander
/**
 * Read the file into a hidden commander (Similar to g.openWithFileName).
 */
export async function createHiddenCommander(
    fn: string
): Promise<Commands | undefined> {
    const c = new Commands(fn, app.nullGui);
    // const theFile = app.loadManager.openAnyLeoFile(fn); // LEOJS : UNUSED
    // if (theFile){
    //     await c.fileCommands.openLeoFile(fn, true, true);
    // }
    try {
        const exists = await os_path_exists(fn);
        if (app.loadManager!.isLeoFile(fn) && exists) {
            await c.fileCommands.openLeoFile(fn, true, true);
            return c;
        }
    } catch (e) {
        es_exception(e);
    }
    return undefined;
}
//@+node:felix.20220108215158.1: *3* g.defaultLeoFileExtension
export function defaultLeoFileExtension(c?: Commands): string {
    const conf = c ? c.config : app.config;
    return conf.getString('default-leo-extension') || '.leo';
}
//@+node:felix.20220108220012.1: *3* g.ensure_extension
export function ensure_extension(name: string, ext: string): string {
    let theFile: string;
    let old_ext: string;

    [theFile, old_ext] = os_path_splitext(name);
    if (!name) {
        return name; // don't add to an empty name.
    }
    if (['.db', '.leo', '.leojs'].includes(old_ext)) {
        return name;
    }
    if (old_ext && old_ext === ext) {
        return name;
    }

    return name + ext;
}
//@+node:felix.20230430163312.1: *3* g.filecmp_cmp
export async function filecmp_cmp(
    path1: string,
    path2: string,
    shallow = true
): Promise<boolean> {
    let w_same = false;
    let w_uri: vscode.Uri;
    w_uri = makeVscodeUri(path1); // first uri, no matter if shallow or not.
    if (shallow) {
        const stats1 = await vscode.workspace.fs.stat(w_uri);
        w_uri = makeVscodeUri(path2);
        const stats2 = await vscode.workspace.fs.stat(w_uri);
        w_same = stats1.size === stats2.size && stats1.mtime === stats2.mtime;
    } else {
        const file1 = await vscode.workspace.fs.readFile(w_uri);
        w_uri = makeVscodeUri(path2);
        const file2 = await vscode.workspace.fs.readFile(w_uri);
        w_same = Buffer.compare(file1, file2) === 0;
    }
    return w_same;
}
//@+node:felix.20211228213652.1: *3* g.fullPath
/**
 * Return the full path (including fileName) in effect at p.
 *
 * Create neither the path nor the fileName.
 *
 * This function is deprecated. Use c.fullPath(p) instead.
 */
export function fullPath(
    c: Commands,
    p: Position,
    simulate: boolean = false
): string {
    return c.fullPath(p, simulate);
    // Search p and p's parents.
    // for (let p of p_p.self_and_parents(false)) {
    //     const aList: any[] = get_directives_dict_list(p);
    //     const w_path: string = c.scanAtPathDirectives(aList);
    //     let fn: string = simulate ? p.h : p.anyAtFileNodeName();
    //     //fn = p.h if simulate else p.anyAtFileNodeName()
    //     // Use p.h for unit tests.
    //     if (fn) {
    //         // Fix #102: expand path expressions.
    //         fn = c.expand_path_expression(fn);  // #1341.
    //         // fn = os.path.expanduser(fn);  // 1900.

    //         if (fn[0] === '~') {
    //             fn = path.join(os.homedir(), fn.slice(1));
    //         }

    //         return os_path_finalize_join(undefined, w_path, fn);  // #1341.
    //     }

    // }
    // return '';
}
//@+node:felix.20230518232533.1: *3* g.getEncodingAt
/**
 * Return the encoding in effect at p and/or for string s.
 *
 * Read logic:  s is not None.
 * Write logic: s is None.
 */
export function getEncodingAt(
    p: Position,
    b?: Uint8Array
): BufferEncoding | undefined {
    let e: BufferEncoding | undefined;
    let junk_s;
    // A BOM overrides everything.
    if (b) {
        [e, junk_s] = stripBOM(b);
        if (e) {
            return e;
        }
    }
    const aList = get_directives_dict_list(p);
    e = scanAtEncodingDirectives(aList);
    if (b && Buffer.from(b).toString().trim() && !e) {
        e = 'utf-8' as BufferEncoding;
    }
    return e;
}
//@+node:felix.20230518225302.1: *3* g.is_binary_file/external_file/string
// export function is_binary_file(f: any): boolean {

//     return f and isinstance(f, io.BufferedIOBase)

// }
export async function is_binary_external_file(
    fileName: string
): Promise<boolean> {
    try {
        // with open(fileName, 'rb') as f:
        //     s = f.read(1024)  // bytes, in Python 3.
        const w_readUri = makeVscodeUri(fileName);
        const readData = await vscode.workspace.fs.readFile(w_readUri);
        const trimmedData = readData.slice(0, 1024);
        const s = Buffer.from(trimmedData).toString();
        return is_binary_string(s);
        // except IOError:
        //     return False
    } catch (exception) {
        es_exception(exception);
        return false;
    }
}
export function is_binary_string(s: string): boolean {
    // http://stackoverflow.com/questions/898669
    // aList is a list of all non-binary characters.
    // aList = [7, 8, 9, 10, 12, 13, 27] + list(range(0x20, 0x100))
    // return bool(s.translate(None, bytes(aList)))  // type:ignore

    const nullCharacter = '\x00';
    const nonPrintableCharactersRegex = /[^\x09\x0A\x0D\x20-\x7E]/;

    return s.includes(nullCharacter) || nonPrintableCharactersRegex.test(s);
}
//@+node:felix.20221219233638.1: *3* g.is_sentinel
/**
 * Return True if line starts with a sentinel comment.
 *
 * Leo 6.7.2: Support blackened sentinels.
 */
export function is_sentinel(
    line: string,
    delims: [string | undefined, string | undefined, string | undefined]
): boolean {
    let delim1, delim2, delim3, sentinel1, sentinel2;
    [delim1, delim2, delim3] = delims;
    // Defensive code. Make *sure* delim has no trailing space.
    if (delim1) {
        delim1 = delim1.trimEnd();
    }
    line = line.trimStart();
    if (delim1) {
        sentinel1 = delim1 + '@';
        sentinel2 = delim1 + ' @';
        return line.startsWith(sentinel1) || line.startsWith(sentinel2);
    }
    let i, j;
    if (delim2 && delim3) {
        sentinel1 = delim2 + '@';
        sentinel2 = delim2 + ' @';
        if (line.includes(sentinel1)) {
            i = line.indexOf(sentinel1);
            j = line.indexOf(delim3);
            return 0 === i && i < j;
        }
        if (line.includes(sentinel2)) {
            i = line.indexOf(sentinel2);
            j = line.indexOf(delim3);
            return 0 === i && i < j;
        }
    }
    error(`is_sentinel: can not happen. delims: ${delims}`);
    return false;
}
//@+node:felix.20230413202326.1: *3* g.makeAllNonExistentDirectories
/**
 * A wrapper from os.makedirs.
 * Attempt to make all non-existent directories.
 *
 * Return True if the directory exists or was created successfully.
 */
export async function makeAllNonExistentDirectories(
    theDir: string
): Promise<string | undefined> {
    // Return True if the directory already exists.
    theDir = os_path_normpath(theDir);

    let [w_exists, w_isDir] = await Promise.all([
        os_path_exists(theDir),
        os_path_isdir(theDir),
    ]);

    if (w_exists && w_isDir) {
        return theDir;
    }

    // #1450: Create the directory with os.makedirs.
    try {
        const w_uri = makeVscodeUri(theDir);
        await vscode.workspace.fs.createDirectory(w_uri);
        return theDir;
    } catch (exception) {
        return undefined;
    }
}

//@+node:felix.20220511001701.1: *3* g.openWithFileName
/**
 * Create a Leo Frame for the indicated fileName if the file exists.
 *
 * Return the commander of the newly-opened outline.
 */
export function openWithFileName(
    fileName: string,
    old_c: Commands | undefined,
    gui?: LeoGui
): Promise<Commands | undefined> {
    return app.loadManager!.loadLocalFile(fileName, gui, old_c);
}
//@+node:felix.20220106231022.1: *3* g.readFileIntoString
/**
 *  Return the contents of the file whose full path is fileName.

    Return (s,e)
    s is the string, converted to unicode, or None if there was an error.
    e is the encoding of s, computed in the following order:
    - The BOM encoding if the file starts with a BOM mark.
    - The encoding given in the // -*- coding: utf-8 -*- line for python files.
    - The encoding given by the 'encoding' keyword arg.
    - None, which typically means 'utf-8'.
 */
export async function readFileIntoString(
    fileName: string,
    encoding: BufferEncoding = 'utf-8', // BOM may override this.
    kind: string | undefined = undefined, // @file, @edit, ...
    verbose: boolean = true
): Promise<[string | undefined, BufferEncoding | undefined]> {
    if (!fileName) {
        if (verbose) {
            trace('no fileName arg given');
        }
        return [undefined, undefined];
    }

    const w_isDir = await os_path_isdir(fileName);
    if (w_isDir) {
        if (verbose) {
            trace('not a file:', fileName);
        }
        return [undefined, undefined];
    }

    if (!(await os_path_exists(fileName))) {
        if (verbose) {
            error('file not found:', fileName);
        }
        return [undefined, undefined];
    }

    let s: string | undefined;
    let e: BufferEncoding | undefined;
    let junk: string;

    try {
        const w_uri = makeVscodeUri(fileName);
        let readData = await vscode.workspace.fs.readFile(w_uri);
        if (!readData) {
            return ['', undefined];
        }
        [e, readData] = stripBOM(readData);
        if (!e) {
            // Python's encoding comments override everything else.
            let [junk, ext] = os_path_splitext(fileName);
            if (ext === '.py') {
                e = getPythonEncodingFromString(readData);
            }
        }
        s = toUnicode(readData, e || encoding);
        // const s = Buffer.from(readData).toString('utf-8');
        return [s, e];
    } catch (iOError) {
        // Translate 'can not open' and kind, but not fileName.
        if (verbose) {
            error('can not open', '', kind || '', fileName);
        }
    }

    // ? needed ?
    // catch (exception){
    //     error(`readFileIntoString: unexpected exception reading ${ fileName } `);
    //     es_exception();
    // }

    return [undefined, undefined];
}

//@+node:felix.20230423233617.1: *3* g.readFileToUnicodeString
/**
 * Return the raw contents of the file whose full path is fn.
 */
export async function readFileIntoUnicodeString(
    fn: string,
    encoding?: BufferEncoding,
    silent?: boolean
): Promise<string | undefined> {
    try {
        const w_uri = makeVscodeUri(fn);
        let s = await vscode.workspace.fs.readFile(w_uri);
        return toUnicode(s, encoding);
    } catch (e) {
        if (!silent) {
            error('can not open', fn);
        }
        error(`readFileIntoUnicodeString: unexpected exception reading ${fn}`);
        es_exception(e);
    }
    return undefined;
}
//@+node:felix.20230501215854.1: *3* g.readlineForceUnixNewline
//@+at Stephen P. Schaefer 9/7/2002
//
// The Unix readline() routine delivers "\r\n" line end strings verbatim,
// while the windows versions force the string to use the Unix convention
// of using only "\n". This routine causes the Unix readline to do the
// same.
//@@c

export function readlineForceUnixNewline(
    f: string[],
    fileName?: string
): string {
    // Addapted for leojs : receives array of string with their newline endings intact
    let s = f.shift();
    if (s == null) {
        s = '';
    }
    //   try {
    //     s = f.readline();
    //   } catch (err) {
    //     console.log(`UnicodeDecodeError: ${fileName}`, f, err);
    //   }
    if (s.length >= 2 && s.slice(-2) === '\r\n') {
        s = s.slice(0, -2) + '\n';
    }

    return s;
}
//@+node:felix.20230711202208.1: *3* g.os_remove
export async function os_remove(fileName: string): Promise<void> {
    const w_uri = makeVscodeUri(fileName);
    await vscode.workspace.fs.delete(w_uri);
}
//@+node:felix.20220412004053.1: *3* g.sanitize_filename
/**
 * Prepares string s to be a valid file name:
 *
 * - substitute '_' for whitespace and special path characters.
 * - eliminate all other non-alphabetic characters.
 * - convert double quotes to single quotes.
 * - strip leading and trailing whitespace.
 * - return at most 128 characters.
 */
export function sanitize_filename(s: string): string {
    const result: string[] = [];

    let ch: string;
    for (let i = 0; i < s.length; i++) {
        ch = s[i];
        if (
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(ch)
        ) {
            result.push(ch);
        } else if (ch === '\t') {
            result.push(' ');
        } else if (ch === '"') {
            result.push("'");
        } else if ('\\/:|<>*:._'.includes(ch)) {
            result.push('_');
        }
    }

    s = result.join('').trim();
    let n;
    while (s.length > 1) {
        n = s.length;
        s = s.split('__').join('_');
        if (s.length === n) {
            break;
        }
    }
    return s.slice(0, 128);
}
//@+node:felix.20220106230957.1: *3* g.setGlobalOpenDir
export function setGlobalOpenDir(fileName: string): void {
    if (fileName) {
        app.globalOpenDir = os_path_dirname(fileName);
        // g.es('current directory:',g.app.globalOpenDir)
    }
}
//@+node:felix.20211104230025.1: *3* g.shortFileName
/**
 * Return the base name of a path.
 */
export function shortFileName(fileName?: string): string {
    //  return os.path.basename(fileName) if fileName else ''
    return fileName ? path.basename(fileName) : '';
}

export const shortFilename = shortFileName;

//@+node:felix.20220412232748.1: *3* g.splitLongFileName
/**
 * Return fn, split into lines at slash characters.
 */
export function splitLongFileName(fn: string, limit: number = 40): string {
    const aList = fn.split('\\').join('/').split('/');

    let n = 0;
    let result: string[] = [];

    let i: number = 0;

    for (let s of aList) {
        n += s.length;
        result.push(s);
        if (i + 1 < aList.length) {
            result.push('/');
            n += 1;
        }
        if (n > limit) {
            result.push('\n');
            n = 0;
        }
        i += 1;
    }
    return result.join('');
}
//@+node:felix.20230422213613.1: *3* g.writeFile
/**
 * Create a file with the given contents.
 */
export async function writeFile(
    contents: Uint8Array | string,
    encoding: BufferEncoding,
    fileName: string
): Promise<boolean> {
    try {
        if (typeof contents === 'string') {
            contents = toEncodedString(contents, encoding);
        }

        // // 'wb' preserves line endings.
        // with open(fileName, 'wb') as f:
        //     f.write(contents)  // type:ignore

        const w_uri = makeVscodeUri(fileName);
        await vscode.workspace.fs.writeFile(w_uri, contents);

        return true;
    } catch (e) {
        console.log(`exception writing: ${fileName}:\n${e}`);
        // g.trace(g.callers())
        // g.es_exception()
        return false;
    }
}
//@+node:felix.20230422213619.1: *3* g.write_file_if_changed
/**
 * Replace file whose filename is give with s, but *only* if file's
 * context has changed (or the file does not exist).
 * & Return true if the file was written.
 */
export async function write_file_if_changed(
    fn: string,
    s: string,
    encoding: BufferEncoding = 'utf-8'
): Promise<boolean> {
    try {
        const encoded_s = toEncodedString(s, encoding, true);
        if (await os_path_exists(fn)) {
            // with open(fn, 'rb') as f
            //     contents = f.read()
            const w_uri = makeVscodeUri(fn);
            const contents = await vscode.workspace.fs.readFile(w_uri);
            if (Buffer.compare(contents, encoded_s) === 0) {
                return false;
            }
        }
        // with open(fn, 'wb') as f
        //     f.write(encoded_s);
        const w_uri = makeVscodeUri(fn);
        await vscode.workspace.fs.writeFile(w_uri, encoded_s);
        return true;
    } catch (exception) {
        es_print(`Exception writing ${fn}`);
        es_exception();
        return false;
    }
}

//@+node:felix.20220526234706.1: *3* g.makeVscodeUri
/**
 * * VSCODE compatibility helper method:
 * Builds a valid URI from a typical filename string.
 *
 * @param p_fn String form of fsPath or path
 * @returns An URI for file access compatible with web extensions filesystems
 */
export function makeVscodeUri(p_fn: string): vscode.Uri {
    if (isBrowser || (app.vscodeUriScheme && app.vscodeUriScheme !== 'file')) {
        try {
            const newUri = app.vscodeWorkspaceUri!.with({ path: p_fn });
            return newUri;
        } catch (e) {
            console.log(
                "ERROR: tried to build a vscode.URI from a browser scheme's URI 'with' method"
            );
            throw new Error(
                'g.makeVscodeUri cannot make an URI with the string: ' + p_fn
            );
        }
    } else {
        // Normal file in desktop app
        return vscode.Uri.file(p_fn);
    }
}

//@+node:felix.20211104210802.1: ** g.Finding & Scanning
//@+node:felix.20220410215925.1: *3* g.find_word
/**
 * Return the index of the first occurance of word in s, or -1 if not found.
 *
 * g.find_word is *not* the same as s.find(i,word);
 * g.find_word ensures that only word-matches are reported.
 */
export function find_word(s: string, word: string, i: number = 0): number {
    let progress: number;
    while (i < s.length) {
        progress = i;
        i = s.indexOf(word, i);
        if (i === -1) {
            return -1;
        }
        // Make sure we are at the start of a word.
        if (i > 0) {
            const ch = s[i - 1];
            if (ch === '_' || isAlNum(ch)) {
                i += word.length;
                continue;
            }
        }
        if (match_word(s, i, word)) {
            return i;
        }
        i += word.length;
        console.assert(progress < i);
    }

    return -1;
}
//@+node:felix.20230427235714.1: *3* g.findRootsWithPredicate
/**
 * Commands often want to find one or more **roots**, given a position p.
 * A root is the position of any node matching a predicate.
 *
 * This function formalizes the search order used by the black,
 * pylint, pyflakes and the rst3 commands, returning a list of zero
 * or more found roots.
 */
export function findRootsWithPredicate(
    c: Commands,
    root: Position,
    predicate?: (p: Position) => boolean
): Position[] {
    const seen: VNode[] = [];
    const roots = [];
    if (predicate == null) {
        // A useful default predicate for python.
        // pylint: disable=function-redefined

        predicate = (p: Position): boolean => {
            const headline = p.h.trim();
            const is_python =
                headline.endsWith('py') || headline.endsWith('pyw');
            return p.isAnyAtFileNode() && is_python;
        };
    }

    // 1. Search p's tree.
    for (const p of root.self_and_subtree(false)) {
        if (predicate(p) && !seen.includes(p.v)) {
            seen.push(p.v);
            roots.push(p.copy());
        }
    }

    if (roots.length) {
        return roots;
    }
    // 2. Look up the tree.
    for (const p of root.parents()) {
        if (predicate(p)) {
            return [p.copy()];
        }
    }
    // 3. Expand the search if root is a clone.
    const clones: VNode[] = [];
    for (const p of root.self_and_parents(false)) {
        if (p.isCloned()) {
            clones.push(p.v);
        }
    }
    if (clones.length) {
        for (const p of c.all_positions(false)) {
            if (predicate(p)) {
                // Match if any node in p's tree matches any clone.
                for (const p2 of p.self_and_subtree()) {
                    if (clones.includes(p2.v)) {
                        return [p.copy()];
                    }
                }
            }
        }
    }
    return [];
}
//@+node:felix.20221025000455.1: *3* g.see_more_lines
/**
 * Extend index i within string s to include n more lines.
 */
export function see_more_lines(s: string, ins: number, n = 4): number {
    // Show more lines, if they exist.
    if (n > 0) {
        for (let z = 0; z < n; z++) {
            if (ins >= s.length) {
                break;
            }
            let i;
            let j;
            [i, j] = getLine(s, ins);
            ins = j;
        }
    }

    return Math.max(0, Math.min(ins, s.length));
}
//@+node:felix.20211104230121.1: *3* g.splitLines
/**
 * Split s into lines, preserving the number of lines and the endings
 * of all lines, including the last line.
 */
export function splitLines(s?: string): string[] {
    if (s) {
        // return s.split(/\r?\n/).map(p_s => p_s + '\n');
        // * improved from https://stackoverflow.com/a/62278659/920301
        return s.match(/[^\n]*\n|[^\n]+/g) || [];
    } else {
        return [];
    }
}

//@+node:felix.20220410214855.1: *3* Scanners: no error messages
//@+node:felix.20211104213154.1: *4* g.find_line_start
/**
 * Return the index in s of the start of the line containing s[i].
 */
export function find_line_start(s: string, p_i: number): number {
    if (p_i < 0) {
        return 0; // New in Leo 4.4.5: add this defensive code.
    }

    // bug fix: 11/2/02: change i to i+1 in rfind
    const i: number = s.substring(0, p_i + 1).lastIndexOf('\n'); // Finds the highest index in the range.
    // i = s.rfind('\n', 0, i + 1)

    if (i === -1) {
        return 0;
    } else {
        return i + 1;
    }
}
//@+node:felix.20230423232315.1: *4* g.find_on_line
export function find_on_line(s: string, i: number, pattern: string): number {
    let j = s.indexOf('\n', i);
    if (j === -1) {
        j = s.length;
    }

    var k = s.indexOf(pattern, i);
    if (k >= 0 && k < j) {
        return k;
    }
    return -1;
}
//@+node:felix.20230519000231.1: *4* g.is_c_id
export function is_c_id(ch: string): boolean {
    return isWordChar(ch);
}
//@+node:felix.20211104221002.1: *4* g.is_special
/**
 * Return non-negative number if the body text contains the @ directive.
 */
export function is_special(s: string, directive: string): [boolean, number] {
    console.assert(directive && directive.substring(0, 1) === '@');
    // Most directives must start the line.
    const lws: boolean = ['@others', '@all'].includes(directive);
    const pattern = lws
        ? new RegExp('^\\s*(' + directive + '\\b)', 'm')
        : new RegExp('^(' + directive + '\\b)', 'm');

    const m = pattern.exec(s);

    if (m) {
        // javascript returns index including spaces before the match after newline
        return [true, m.index + m[0].length - m[1].length];
    }
    return [false, -1];
}

//@+node:felix.20211104220753.1: *4* g.is_nl
export function is_nl(s: string, i: number): boolean {
    return i < s.length && (s.charAt(i) === '\n' || s.charAt(i) === '\r');
}

//@+node:felix.20220411230914.1: *4* g.isAlpha
export function isAlpha(ch: string) {
    return /^[A-Z]$/i.test(ch);
}
//@+node:felix.20220410220931.1: *4* g.isAlNum
/**
 * from https://stackoverflow.com/a/25352300/920301
 */
export function isAlNum(str: string): boolean {
    var code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (
            !(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)
        ) {
            // lower alpha (a-z)
            return false;
        }
    }
    return true;
}
//@+node:felix.20211104220826.1: *4* g.isDigit
export function isDigit(s: string): boolean {
    return s >= '0' && s <= '9';
}
//@+node:felix.20220110223811.1: *4* g.is_ws & is_ws_or_nl
export function is_ws(ch: string): boolean {
    return ch === '\t' || ch === ' ';
}
export function is_ws_or_nl(s: string, i: number): boolean {
    return is_nl(s, i) || (i < s.length && is_ws(s[i]));
}
//@+node:felix.20211104221259.1: *4* g.match
export function match(s: string, i: number, pattern: string): boolean {
    // Warning: this code makes no assumptions about what follows pattern.
    // Equivalent to original in python (only looks in specific substring)
    // return s and pattern and s.find(pattern, i, i + len(pattern)) == i
    // didn't work with xml expression
    // return !!s && !!pattern && s.substring(i, i + pattern.length + 1).search(pattern) === 0;
    return (
        !!s &&
        !!pattern &&
        s.substring(i, i + pattern.length + 1).startsWith(pattern)
    );
}

//@+node:felix.20211104221309.1: *4* g.match_word & g.match_words
export function match_word(s: string, i: number, pattern: string): boolean {
    // Using a regex is surprisingly tricky.
    if (!pattern) {
        return false;
    }
    if (i > 0 && isWordChar(s.charAt(i - 1))) {
        //  Bug fix: 2017/06/01.
        return false;
    }
    const j = pattern.length;
    if (j === 0) {
        return false;
    }
    let found = s.indexOf(pattern, i);

    if (found < i || found >= i + j) {
        found = -1;
    }
    if (found !== i) {
        return false;
    }
    if (i + j >= s.length) {
        return true;
    }

    const ch = s.charAt(i + j);
    return !isWordChar(ch);

    // * OLD PLACEHOLDER
    /*     const pat = new RegExp(pattern + "\\b");
        return s.substring(i).search(pat) === 0; */
}

export function match_words(s: string, i: number, patterns: string[]): boolean {
    return patterns.some((pattern) => match_word(s, i, pattern));
}
//@+node:felix.20220208154405.1: *4* g.skip_blank_lines
/**
 * This routine differs from skip_ws_and_nl in that
 * it does not advance over whitespace at the start
 * of a non-empty or non-nl terminated line
 */
export function skip_blank_lines(s: string, i: number): number {
    while (i < s.length) {
        if (is_nl(s, i)) {
            i = skip_nl(s, i);
        } else if (is_ws(s[i])) {
            const j = skip_ws(s, i);
            if (is_nl(s, j)) {
                i = j;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    return i;
}

//@+node:felix.20220112011805.1: *4* g.skip_c_id
export function skip_c_id(s: string, i: number): number {
    let n: number = s.length;
    while (i < n && isWordChar(s[i])) {
        i += 1;
    }
    return i;
}
//@+node:felix.20211104220621.1: *4* g.skip_id
export function skip_id(s: string, i: number, chars?: string): number {
    chars = chars ? chars.toString() : '';
    const n = s.length;
    while (
        i < n &&
        (isWordChar(s.charAt(i)) || chars.indexOf(s.charAt(i)) >= 0)
    ) {
        i += 1;
    }
    return i;
}

//@+node:felix.20211104220540.1: *4* g.skip_line, skip_to_start/end_of_line
/* These methods skip to the next newline, regardless of whether the
newline may be preceded by a backslash. Consequently, they should be
used only when we know that we are not in a preprocessor directive or
string.
*/

export function skip_line(s: string, i: number): number {
    if (i >= s.length) {
        return s.length;
    }
    if (i < 0) {
        i = 0;
    }
    i = s.indexOf('\n', i);
    if (i === -1) {
        return s.length;
    }
    return i + 1;
}

export function skip_to_end_of_line(s: string, i: number): number {
    if (i >= s.length) {
        return s.length;
    }
    if (i < 0) {
        i = 0;
    }
    i = s.indexOf('\n', i);
    if (i === -1) {
        return s.length;
    }
    return i;
}

export function skip_to_start_of_line(s: string, i: number): number {
    if (i >= s.length) {
        return s.length;
    }
    if (i <= 0) {
        return 0;
    }
    // Don't find s[i], so it doesn't matter if s[i] is a newline.
    let w_i = s.substring(0, i).lastIndexOf('\n');

    if (w_i === -1) {
        return 0;
    }
    return w_i + 1;
}

//@+node:felix.20211104220631.1: *4* g.skip_long
/**
 * Scan s[i:] for a valid int.
 * Return (i, val) or (i, None) if s[i] does not point at a number.
 */
export function skip_long(s: string, i: number): [number, number | undefined] {
    let val: number = 0;
    i = skip_ws(s, i);
    let n: number = s.length;
    if (i >= n || (!isDigit(s.charAt(i)) && !'+-'.includes(s.charAt(i)))) {
        return [i, undefined];
    }
    let j: number = i;
    if ('+-'.includes(s.charAt(i))) {
        // Allow sign before the first digit
        i += 1;
    }
    while (i < n && isDigit(s.charAt(i))) {
        i += 1;
    }
    try {
        // There may be no digits.
        val = Number(s.slice(j, i));
        return [i, val];
    } catch (err: any) {
        return [i, undefined];
    }
}
//@+node:felix.20211104220814.1: *4* g.skip_nl
/**
 * We need this function because different systems have different end-of-line conventions.
 * Skips a single "logical" end-of-line character.
 */
export function skip_nl(s: string, i: number): number {
    if (match(s, i, '\r\n')) {
        return i + 2;
    }
    if (match(s, i, '\n') || match(s, i, '\r')) {
        return i + 1;
    }
    return i;
}

//@+node:felix.20220411231219.1: *4* g.skip_python_string
export function skip_python_string(s: string, i: number): number {
    if (match(s, i, "'''") || match(s, i, '"""')) {
        const delim = s[i].repeat(3);
        i += 3;
        const k = s.indexOf(delim, i);
        if (k > -1) {
            return k + 3;
        }
        return s.length;
    }
    return skip_string(s, i);
}
//@+node:felix.20220411231208.1: *4* g.skip_string
/**
 * Scan forward to the end of a string.
 */
export function skip_string(s: string, i: number): number {
    const delim = s[i];
    i += 1;

    console.assert('\'"'.includes(delim), delim.toString() + ' ' + s);
    let n = s.length;

    while (i < n && s[i] !== delim) {
        if (s[i] === '\\') {
            i += 2;
        } else {
            i += 1;
        }
    }
    if (i >= n) {
        // pass
    } else if (s[i] === delim) {
        i += 1;
    }
    return i;
}
//@+node:felix.20211104220609.1: *4* g.skip_to_char
/**
 * Returns object instead of original python tuple
 */
export function skip_to_char(
    s: string,
    i: number,
    ch: string
): [number, string] {
    const j: number = s.indexOf(ch, i);
    if (j === -1) {
        // return {
        //     position: s.length,
        //     result: s.substring(i)
        // };
        return [s.length, s.substring(i)];
    }
    // return {
    //     position: j,
    //     result: s.substring(i, j)
    // };
    return [j, s.substring(i, j)];
}
//@+node:felix.20211104220639.1: *4* g.skip_ws, skip_ws_and_nl
export function skip_ws(s: string, i: number): number {
    const n: number = s.length;
    while (i < n && '\t '.indexOf(s.charAt(i)) >= 0) {
        i += 1;
    }
    return i;
}

export function skip_ws_and_nl(s: string, i: number): number {
    const n: number = s.length;
    while (i < n && ' \t\n\r'.indexOf(s.charAt(i))) {
        i += 1;
    }
    return i;
}
//@+node:felix.20220511213218.1: ** g.Git
//@+node:felix.20220511213305.1: *3* g.gitInfoForFile
/**
 * Return the git (branch, commit) info associated for the given file.
 */
export function gitInfoForFile(filename: string): [string, string] {
    // g.gitInfo and g.gitHeadPath now do all the work.
    return gitInfo(filename);
}
//@+node:felix.20230714231140.1: *3* g.gitHeadPath

/**
 * Compute the path to .git/HEAD given the path.
 */
export async function gitHeadPath(path_s: string): Promise<string | undefined> {
    // const w_path = path(path_s);
    // #1780: Look up the directory tree, looking the .git directory.
    while (await os_path_exists(path_s)) {
        const head = path.join(path_s, '.git', 'HEAD');
        if (await os_path_exists(head)) {
            return head;
        }
        if (path_s === path.dirname(path_s)) {
            // path.parent()
            break;
        }
        path_s = path.dirname(path_s);
    }
    return undefined;
}
//@+node:felix.20230714231513.1: *3* g.execGitCommand
/**
 * Execute the given git command in the given directory.
 */
export function execGitCommand(
    command: string,
    directory: string
): Promise<string[]> {
    console.log('TODO : execGitCommand');
    return Promise.resolve([]);

    /*
    const git_dir = g.finalize_join(directory, '.git')
    if not g.os_path_exists(git_dir):
        g.trace('not found:', git_dir, g.callers())
        return []
    if '\n' in command:
        g.trace('removing newline from', command)
        command = command.replace('\n', '')
    # #1777: Save/restore os.curdir
    old_dir = os.getcwd()
    if directory:
        os.chdir(directory)

    try
        p = subprocess.Popen(
            shlex.split(command),
            stdout=subprocess.PIPE,
            stderr=None,  # Shows error traces.
            shell=False,
        )
        out, err = p.communicate()
        lines = [g.toUnicode(z) for z in g.splitLines(out or [])]
    finally
        os.chdir(old_dir)

    return lines;
    */
}
//@+node:felix.20230720001117.1: *3* g.gitInfo
/**
 * Path may be a directory or file.

    Return the branch and commit number or ('', '').
 */
export function gitInfo(p_path?: string): [string, string] {

    // Set defaults.
    let branch = '';
    let commit = '';
    const w_gitAPI = gitAPI;
    try {
        if (w_gitAPI && w_gitAPI.repositories.length &&
            w_gitAPI.repositories[0].state.HEAD
        ) {
            branch = w_gitAPI.repositories[0].state.HEAD.name || '';
            commit = w_gitAPI.repositories[0].state.HEAD.commit || '';
            if (commit && commit.length) {
                commit = commit.trim().slice(0, 12);
            }
        }

    } catch (errorGit) {
        console.log('ERROR : LEOJS gitInfo :', errorGit);
    }

    /*
    if (p_path == null ){
        // Default to leo/core.
        p_path = g.os_path_dirname(__file__)
    }
    if !g.os_path_isdir(p_path)
        p_path = g.os_path_dirname(p_path)
    // Does path/../ref exist?
    p_path = g.gitHeadPath(p_path)
    if !p_path
        return branch, commit
    try
        with open(p_path) as f
            s = f.read()
            if !s.startsWith('ref')
                branch = 'None'
                commit = s[:7]
                return branch, commit
        // On a proper branch
        pointer = s.split()[1]
        dirs = pointer.split('/')
        branch = dirs[-1]
    except IOError:
        g.trace('can not open:', p_path)
        return branch, commit
    // Try to get a better commit number.
    git_dir = g.finalize_join(p_path, '..')
    try
        p_path = g.finalize_join(git_dir, pointer)
        with open(p_path) as f:
            s = f.read()
        commit = s.strip()[0:12]
        // shorten the hash to a unique shortname
    catch IOError
        try:
            p_path = g.finalize_join(git_dir, 'packed-refs')
            with open(p_path) as f:  // type:ignore
                for line in f:
                    if line.strip().endswith(' ' + pointer):
                        commit = line.split()[0][0:12]
                        break
        except IOError:
            pass

    */

    return [branch, commit];

}
//@+node:felix.20211106230549.1: ** g.Hooks & Plugins
//@+node:felix.20211106230549.2: *3* g.act_on_node
export function dummy_act_on_node(c: Commands, p: Position): any {
    // pass
}
// This dummy definition keeps pylint happy.
//# Plugins can change this.

export let act_on_node = dummy_act_on_node;

//@+node:felix.20211106230549.3: *3* g.childrenModifiedSet, g.contentModifiedSet
export const childrenModifiedSet: VNode[] = [];
export const contentModifiedSet: VNode[] = [];
//@+node:felix.20211106230549.4: *3* g.doHook
/**
 * This global function calls a hook routine. Hooks are identified by the
 * tag param.
 *
 * Returns the value returned by the hook routine, or None if the there is
 * an exception.
 *
 * We look for a hook routine in three places:
 * 1. c.hookFunction
 * 2. app.hookFunction
 * 3. leoPlugins.doPlugins()
 *
 * Set app.hookError on all exceptions.
 * Scripts may reset app.hookError to try again.
 */
export function doHook(tag: string, keywords?: { [key: string]: any }): any {
    if (app.killed || app.hookError) {
        return undefined;
    }
    // unneeded
    /*
    if (args && args.length){
        // A minor error in Leo's core.
        pr(`***ignoring args param.  tag = ${tag}`);
    }
    */
    if (!app.enablePlugins) {
        if (['open0', 'start1'].includes(tag)) {
            console.log(
                'Plugins disabled: use_plugins is 0 in a leoSettings.leo file.'
            );
            // warning("Plugins disabled: use_plugins is 0 in a leoSettings.leo file.");
        }
        return undefined;
    }
    // Get the hook handler function.  Usually this is doPlugins.
    const c: Commands = keywords ? keywords['c'] : undefined;
    // pylint: disable=consider-using-ternary
    let f = (c && c.hookFunction) || app.hookFunction;
    if (!f) {
        if (!!app.pluginsController) {
            app.hookFunction = app.pluginsController?.doPlugins;
            if (app.hookFunction) {
                f = app.hookFunction;
            }
        }
    }
    if (!f) {
        // console.log('TODO: (Plugin system) g.doHook for tag: ', tag);
        return;
    }
    try {
        // Pass the hook to the hook handler.
        // pr('doHook',f.__name__,keywords.get('c'))
        return f(tag, keywords);
    } catch (exception) {
        es_exception();
        app.hookError = true; // Suppress this function.
        app.idle_time_hooks_enabled = false;
        return undefined;
    }
    // TODO !
    /*
    if g.app.killed or g.app.hookError:
        return None
    if args:
        # A minor error in Leo's core.
        g.pr(f"***ignoring args param.  tag = {tag}")
    if not g.app.config.use_plugins:
        if tag in ('open0', 'start1'):
            g.warning("Plugins disabled: use_plugins is 0 in a leoSettings.leo file.")
        return None
    # Get the hook handler function.  Usually this is doPlugins.
    c = keywords.get("c")
    # pylint: disable=consider-using-ternary
    f = (c and c.hookFunction) or g.app.hookFunction
    if not f:
        g.app.hookFunction = f = g.app.pluginsController.doPlugins
    try:
        # Pass the hook to the hook handler.
        # g.pr('doHook',f.__name__,keywords.get('c'))
        return f(tag, keywords)
    catch Exception:
        g.es_exception()
        g.app.hookError = True  # Suppress this function.
        g.app.idle_time_hooks_enabled = False
        return None
    */
    return undefined;
}
//@+node:felix.20211106230549.5: *3* g.Wrappers for g.app.pluginController methods
// Important: we can not define g.pc here!
//@+node:felix.20211106230549.6: *4* g.Loading & registration

/*
def loadOnePlugin(pluginName, verbose=False):
    pc = g.app.pluginsController
    return pc.loadOnePlugin(pluginName, verbose=verbose)

def registerExclusiveHandler(tags, fn):
    pc = g.app.pluginsController
    return pc.registerExclusiveHandler(tags, fn)

def registerHandler(tags, fn):
    pc = g.app.pluginsController
    return pc.registerHandler(tags, fn)

def plugin_signon(module_name, verbose=False):
    pc = g.app.pluginsController
    return pc.plugin_signon(module_name, verbose)

def unloadOnePlugin(moduleOrFileName, verbose=False):
    pc = g.app.pluginsController
    return pc.unloadOnePlugin(moduleOrFileName, verbose)

def unregisterHandler(tags, fn):
    pc = g.app.pluginsController
    return pc.unregisterHandler(tags, fn)

*/
//@+node:felix.20211106230549.7: *4* g.Information
/*
def getHandlersForTag(tags):
    pc = g.app.pluginsController
    return pc.getHandlersForTag(tags)

def getLoadedPlugins():
    pc = g.app.pluginsController
    return pc.getLoadedPlugins()

def getPluginModule(moduleName):
    pc = g.app.pluginsController
    return pc.getPluginModule(moduleName)

def pluginIsLoaded(fn):
    pc = g.app.pluginsController
    return pc.isLoaded(fn)
*/

//@+node:felix.20230508013117.1: ** g.Idle time functions
//@+node:felix.20230508013117.2: *3* g.disableIdleTimeHook
/**
 * Disable the global idle-time hook.
 */
export function disableIdleTimeHook(): void {
    app.idle_time_hooks_enabled = false;
}
//@+node:felix.20230508013117.3: *3* g.enableIdleTimeHook
/**
 * Enable idle-time processing.
 */
export function enableIdleTimeHook(...args: any): void {
    app.idle_time_hooks_enabled = true;
}
//@+node:felix.20230508013117.4: *3* g.IdleTime
/**
 * A thin wrapper for the LeoQtGui.IdleTime class.
 *
 * The IdleTime class executes a handler with a given delay at idle time.
 * The handler takes a single argument, the IdleTime instance::
 *
 *       def handler(timer):
 *           '''IdleTime handler.  timer is an IdleTime instance.'''
 *           delta_t = timer.time-timer.starting_time
 *           g.trace(timer.count, '%2.4f' % (delta_t))
 *           if timer.count >= 5:
 *               g.trace('done')
 *               timer.stop()
 *
 *       # Execute handler every 500 msec. at idle time.
 *       timer = g.IdleTime(handler,delay=500)
 *       if timer: timer.start()
 *
 *   Timer instances are completely independent::
 *
 *       def handler1(timer):
 *           delta_t = timer.time-timer.starting_time
 *           g.trace('%2s %2.4f' % (timer.count,delta_t))
 *           if timer.count >= 5:
 *               g.trace('done')
 *               timer.stop()
 *
 *       def handler2(timer):
 *           delta_t = timer.time-timer.starting_time
 *           g.trace('%2s %2.4f' % (timer.count,delta_t))
 *           if timer.count >= 10:
 *               g.trace('done')
 *               timer.stop()
 *
 *       timer1 = g.IdleTime(handler1, delay=500)
 *       timer2 = g.IdleTime(handler2, delay=1000)
 *       if timer1 and timer2:
 *           timer1.start()
 *           timer2.start()
 */
export function IdleTime(handler: any, delay = 500, tag?: string): any {
    try {
        return new app.gui.idleTimeClass(handler, delay, tag);
    } catch (exception) {
        return undefined;
    }
}
//@+node:felix.20230508013117.5: *3* g.idleTimeHookHandler (stub)
/**
 * This function exists for compatibility.
 */
export function idleTimeHookHandler(timer: any): void {
    es_print('Replaced by IdleTimeManager.on_idle');
    trace(callers());
}
//@+node:felix.20211104210935.1: ** g.Importing
//@+node:felix.20211104210938.1: ** g.Indices, Strings, Unicode & Whitespace
//@+node:felix.20220410005950.1: *3* g.Indices
//@+node:felix.20220410005950.2: *4* g.convertPythonIndexToRowCol
/**
 * Convert index i into string s into zero-based row/col indices.
 */
export function convertPythonIndexToRowCol(
    s: string,
    i: number
): [number, number] {
    if (!s || i <= 0) {
        return [0, 0];
    }

    i = Math.min(i, s.length);

    // works regardless of what s[i] is
    let row = 0;
    for (let j = 0; j < s.length && j < i; j++) {
        if (s[j] === '\n') {
            row++;
        }
    }
    // const row = s.count('\n', 0, i);  // Don't include i

    if (row === 0) {
        return [row, i];
    }

    s = s.substring(0, i);
    const prevNL = s.lastIndexOf('\n') + 1; // Don't include i

    return [row, i - prevNL];
}
//@+node:felix.20220410005950.3: *4* g.convertRowColToPythonIndex
/**
 * Convert zero-based row/col indices into a python index into string s.
 */
export function convertRowColToPythonIndex(
    s: string,
    row: number,
    col: number,
    lines?: string[]
): number {
    if (row < 0) {
        return 0;
    }
    if (lines === undefined) {
        lines = splitLines(s);
    }
    if (row >= lines.length) {
        return s.length;
    }
    col = Math.min(col, lines[row].length);
    // A big bottleneck
    let prev = 0;
    for (let line of lines.slice(0, row)) {
        prev += line.length;
    }
    return prev + col;
}
//@+node:felix.20220208171427.1: *4* g.getWord & getLine
/**
 *
 */
export function getWord(s: string, i: number): [number, number] {
    if (i >= s.length) {
        i = s.length - 1;
    }
    if (i < 0) {
        i = 0;
    }
    // Scan backwards.
    while (0 <= i && i < s.length && isWordChar(s.charAt(i))) {
        i -= 1;
    }
    i += 1;
    // Scan forwards.
    let j = i;
    while (0 <= j && j < s.length && isWordChar(s.charAt(j))) {
        j += 1;
    }
    return [i, j];
}

/**
 * Return i,j such that s[i:j] is the line surrounding s[i].
 * s[i] is a newline only if the line is empty.
 * s[j] is a newline unless there is no trailing newline.
 */
export function getLine(s: string, i: number): [number, number] {
    if (i > s.length) {
        i = s.length - 1;
    }
    if (i < 0) {
        i = 0;
    }
    // A newline *ends* the line, so look to the left of a newline.
    // CONVERTED FROM : j = s.rfind('\n', 0, i);
    let j = s.substring(0, i).lastIndexOf('\n');

    if (j === -1) {
        j = 0;
    } else {
        j += 1;
    }
    let k = s.indexOf('\n', i);

    if (k === -1) {
        k = s.length;
    } else {
        k = k + 1;
    }
    return [j, k];
}
//@+node:felix.20220410005950.5: *4* g.toPythonIndex
/**
 * Convert index to a Python int.
 *
 * index may be a Tk index(x.y) or 'end'.
 */
export function toPythonIndex(s: string, index?: number | string): number {
    if (index === undefined) {
        return 0;
    }
    if (!isNaN(index as any)) {
        return index as number;
    }
    if (index === '1.0') {
        return 0;
    }
    if (index === 'end') {
        return s.length;
    }

    const data = (index as string).split('.');
    let row;
    let col;
    if (data.length === 2) {
        [row, col] = data;
        [row, col] = [Number(row), Number(col)];
        let i = convertRowColToPythonIndex(s, row - 1, col);
        return i;
    }
    trace(`bad string index: ${index}`);
    return 0;
}
//@+node:felix.20220410212530.1: *3* g.Strings
//@+node:felix.20220410212530.2: *4* g.isascii
/*
def isascii(s: str) -> bool:
    # s.isascii() is defined in Python 3.7.
    return all(ord(ch) < 128 for ch in s)
 */
//@+node:felix.20221015014048.1: *4* g.isUpper
export function isUpper(s: string): boolean {
    return s !== s.toLowerCase() && s === s.toUpperCase();
}
//@+node:felix.20221015172825.1: *4* g.capitalize
export function capitalize(s: string): string {
    if (s.length === 0) {
        return s;
    }
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
//@+node:felix.20221015014725.1: *4* g.enumerate
export function* enumerate(it: any, start = 0) {
    let i = start;
    for (const x of it) {
        yield [i++, x];
    }
}
//@+node:felix.20220410212530.3: *4* g.angleBrackets & virtual_event_name
/*
 def angleBrackets(s: str) -> str:
    """Returns < < s > >"""
    lt = "<<"
    rt = ">>"
    return lt + s + rt

virtual_event_name = angleBrackets
 */
/**
 * Return < < s > >
 */
export function angleBrackets(s: string): string {
    const lt = '<<';
    const rt = '>>';
    return lt + s + rt;
}
export const virtual_event_name = angleBrackets;
//@+node:felix.20220410212530.4: *4* g.ensureLeading/TrailingNewlines

export function ensureLeadingNewlines(s: string, n: number): string {
    s = removeLeading(s, '\t\n\r ');
    return '\n'.repeat(n) + s;
}

export function ensureTrailingNewlines(s: string, n: number): string {
    s = removeTrailing(s, '\t\n\r ');
    return s + '\n'.repeat(n);
}

//@+node:felix.20220410212530.5: *4* g.longestCommonPrefix & g.itemsMatchingPrefixInList
/*
def longestCommonPrefix(s1: str, s2: str) -> str:
    """Find the longest prefix common to strings s1 and s2."""
    prefix = ''
    for ch in s1:
        if s2.startswith(prefix + ch):
            prefix = prefix + ch
        else:
            return prefix
    return prefix

def itemsMatchingPrefixInList(s: str, aList: List[str], matchEmptyPrefix: bool=False) -> Tuple[List, str]:
    """This method returns a sorted list items of aList whose prefix is s.

    It also returns the longest common prefix of all the matches.
    """
    if s:
        pmatches = [a for a in aList if a.startswith(s)]
    elif matchEmptyPrefix:
        pmatches = aList[:]
    else: pmatches = []
    if pmatches:
        pmatches.sort()
        common_prefix = reduce(g.longestCommonPrefix, pmatches)
    else:
        common_prefix = ''
    return pmatches, common_prefix
 */
//@+node:felix.20230716225107.1: *4* g.pad
/**
 * Return a string of blanks to pad string s to the given width.
 */
export function pad(s: string, width: number): string {
    const paddingCount: number = Math.max(0, width - s.length);
    return ' '.repeat(paddingCount);
}
//@+node:felix.20220410212530.6: *4* g.removeLeading/Trailing

// Warning: g.removeTrailingWs already exists.
// Do not change it!

/**
 * Remove all characters in chars from the front of s.
 */
export function removeLeading(s: string, chars: string): string {
    let i = 0;
    while (i < s.length && chars.includes(s[i])) {
        i += 1;
    }
    return s.slice(i);
}
/**
 * Remove all characters in chars from the end of s.
 */
export function removeTrailing(s: string, chars: string): string {
    let i = s.length - 1;
    while (i >= 0 && chars.includes(s[i])) {
        i -= 1;
    }
    i += 1;
    return s.slice(0, i);
}

//@+node:felix.20220410212530.7: *4* g.stripBrackets
/*
def stripBrackets(s: str) -> str:
    """Strip leading and trailing angle brackets."""
    if s.startswith('<'):
        s = s[1:]
    if s.endswith('>'):
        s = s[:-1]
    return s
 */
//@+node:felix.20220410212530.8: *4* g.unCamel
/*
def unCamel(s: str) -> List[str]:
    """Return a list of sub-words in camelCased string s."""
    result: List[str] = []
    word: List[str] = []
    for ch in s:
        if ch.isalpha() and ch.isupper():
            if word:
                result.append(''.join(word))
            word = [ch]
        elif ch.isalpha():
            word.append(ch)
        elif word:
            result.append(''.join(word))
            word = []
    if word:
        result.append(''.join(word))
    return result
 */
//@+node:felix.20220410215159.1: *3* g.Unicode
//@+node:felix.20220430215156.1: *4* g.checkUnicode
export const checkUnicode_dict: { [key: string]: boolean } = {};

/**
 * Warn when converting bytes. Report *all* errors.
 *
 * This method is meant to document defensive programming. We don't expect
 * these errors, but they might arise as the result of problems in
 * user-defined plugins or scripts.
 */
export function checkUnicode(s: string, encoding?: string): string {
    const tag = 'g.checkUnicode';

    return s || '';

    // TODO : ? Needed ?
    /*
    if s is None and g.unitTesting:
        return '';

    if isinstance(s, str):
        return s;

    if not isinstance(s, bytes):
        g.error(f"{tag}: unexpected argument: {s!r}")
        return '';

    //
    // Report the unexpected conversion.
    callers = g.callers(1)
    if callers not in checkUnicode_dict:
        g.trace(g.callers())
        g.error(f"\n{tag}: expected unicode. got: {s!r}\n")
        checkUnicode_dict[callers] = True
    //
    // Convert to unicode, reporting all errors.
    if not encoding:
        encoding = 'utf-8'

    try
        s = s.decode(encoding, 'strict')
    except(UnicodeDecodeError, UnicodeError):
        // https://wiki.python.org/moin/UnicodeDecodeError
        s = s.decode(encoding, 'replace')
        g.trace(g.callers())
        g.error(f"{tag}: unicode error. encoding: {encoding!r}, s:\n{s!r}")
    catch Exception:
        g.trace(g.callers())
        g.es_excption()
        g.error(f"{tag}: unexpected error! encoding: {encoding!r}, s:\n{s!r}")


    return s;
    */
}
//@+node:felix.20230420014718.1: *4* g.getPythonEncodingFromString
/**
 * Return the encoding given by Python's encoding line.
 * s is the entire file.
 */
export function getPythonEncodingFromString(
    readData?: Uint8Array | string
): BufferEncoding | undefined {
    let encoding = undefined;
    let [tag, tag2] = ['# -*- coding:', '-*-'];
    let [n1, n2] = [tag.length, tag2.length];
    if (readData) {
        // For Python 3.x we must convert to unicode before calling startsWith.
        // The encoding doesn't matter: we only look at the first line, and if
        // the first line is an encoding line, it will contain only ascii characters.
        const s = toUnicode(readData, 'ascii');
        const lines = splitLines(s);
        let line1 = lines[0].trim();
        let e: BufferEncoding;
        if (line1.startsWith(tag) && line1.endsWith(tag2)) {
            e = line1.substring(n1, -n2).trim() as BufferEncoding;
            if (e && isValidEncoding(e)) {
                encoding = e;
            }
        } else if (match_word(line1, 0, '@first')) {
            // 2011/10/21.
            line1 = line1.substring('@first'.length).trim();
            if (line1.startsWith(tag) && line1.endsWith(tag2)) {
                e = line1.substring(n1, -n2).trim() as BufferEncoding;
                if (e && isValidEncoding(e)) {
                    encoding = e;
                }
            }
        }
    }
    return encoding;
}
//@+node:felix.20220410215214.1: *4* g.isWordChar*
/**
 * Return True if ch should be considered a letter.
 */
export function isWordChar(ch: string): boolean {
    return !!ch && (/^[0-9a-zA-Z]$/.test(ch) || ch === '_');
}

export function isWordChar1(ch: string): boolean {
    return !!ch && (/^[a-zA-Z]$/.test(ch) || ch === '_');
}

//@+node:felix.20230413002946.1: *4* g.stripBOM
/**
 * If there is a BOM, return (e,s2) where e is the encoding
 * implied by the BOM and s2 is the s stripped of the BOM.
 *
 * If there is no BOM, return (None,s)
 *
 * s must be the contents of a file (a string) read in binary mode.
 */
export function stripBOM(
    s_bytes: Uint8Array
): [BufferEncoding | undefined, Uint8Array] {
    const table: [number, BufferEncoding, Uint8Array][] = [
        // Important: test longer bom's first.
        // [4, 'utf-32', codecs.BOM_UTF32_BE],
        // [4, 'utf-32', codecs.BOM_UTF32_LE],
        [3, 'utf-8', codecs.BOM_UTF8],
        [2, 'utf16le', codecs.BOM_UTF16_LE],
        // [2, 'utf-16', codecs.BOM_UTF16_BE],
        // [2, 'utf-16', codecs.BOM_UTF16_LE],
    ];
    if (s_bytes && s_bytes.length) {
        for (const [n, e, bom] of table) {
            console.assert(bom.length === n);
            const subarray = s_bytes.subarray(0, bom.length);
            if (subarray.every((value, index) => value === bom[index])) {
                return [e, s_bytes.subarray(bom.length, s_bytes.length)];
            }
        }
    }
    return [undefined, s_bytes];
}
//@+node:felix.20220410215545.1: *4* g.toUnicode
/**
 * Convert bytes to unicode if necessary.
 */
export function toUnicode(
    s: string | Uint8Array,
    encoding: BufferEncoding | null = null,
    reportErrors = false
): string {
    // TODO : SEE g.toEncodedString.

    // ORIGINAL
    if (typeof s === 'string' || s instanceof String) {
        return s as string;
    }
    const tag = 'g.toUnicode';
    if (!(s instanceof Uint8Array)) {
        // if reportErrors and not isinstance(s, (NullObject, TracingNullObject)):
        // callers = g.callers()
        // if callers not in unicode_warnings.includes(callers):
        //     unicode_warnings[callers] = True
        //     g.error(f"{tag}: unexpected argument of type {s.__class__.__name__}")
        //     g.trace(callers)
        if (reportErrors && s !== null && s !== undefined) {
            error(`${tag}: unexpected argument of type ${typeof s}`);
        }
        return '';
    }
    if (!encoding) {
        encoding = 'utf-8';
    }
    try {
        s = Buffer.from(s).toString(encoding);
    } catch (exception) {
        // except(UnicodeDecodeError, UnicodeError):  # noqa
        //     # https://wiki.python.org/moin/UnicodeDecodeError
        //     s = s.decode(encoding, 'replace')
        //     if reportErrors:
        //         g.error(f"{tag}: unicode error. encoding: {encoding!r}, s:\n{s!r}")
        //         g.trace(g.callers())
        es_exception(exception);
        error(`${tag}: unexpected error! encoding: ${encoding}, s:\n${s}`);
        trace(callers());
    }
    return s as string;
}

//@+node:felix.20220410213527.1: *3* g.Whitespace
//@+node:felix.20220410213527.2: *4* g.computeLeadingWhitespace

/**
 * Returns optimized whitespace corresponding to width with the indicated tab_width.
 */
export function computeLeadingWhitespace(
    width: number,
    tab_width: number
): string {
    if (width <= 0) {
        return '';
    }
    if (tab_width > 1) {
        const tabs = Math.floor(width / tab_width);
        const blanks = Math.floor(width % tab_width);
        return '\t'.repeat(tabs) + ' '.repeat(blanks);
    }
    // Negative tab width always gets converted to blanks.
    return ' '.repeat(width);
}

//@+node:felix.20220410213527.3: *4* g.computeLeadingWhitespaceWidth
/*
# Returns optimized whitespace corresponding to width with the indicated tab_width.

def computeLeadingWhitespaceWidth(s: str, tab_width: int) -> int:
    w = 0
    for ch in s:
        if ch == ' ':
            w += 1
        elif ch == '\t':
            w += (abs(tab_width) - (w % abs(tab_width)))
        else:
            break
    return w
 */
//@+node:felix.20220410213527.4: *4* g.computeWidth
/*
# Returns the width of s, assuming s starts a line, with indicated tab_width.

def computeWidth(s: str, tab_width: int) -> int:
    w = 0
    for ch in s:
        if ch == '\t':
            w += (abs(tab_width) - (w % abs(tab_width)))
        elif ch == '\n':  # Bug fix: 2012/06/05.
            break
        else:
            w += 1
    return w
 */
//@+node:felix.20220410213527.5: *4* g.wrap_lines (newer)

//@+at
// Important note: this routine need not deal with leading whitespace.
//
// Instead, the caller should simply reduce pageWidth by the width of
// leading whitespace wanted, then add that whitespace to the lines
// returned here.
//
// The key to this code is the invarient that line never ends in whitespace.
//@@c
/*
def wrap_lines(lines: List[str], pageWidth: int, firstLineWidth: int=None) -> List[str]:
    """Returns a list of lines, consisting of the input lines wrapped to the given pageWidth."""
    if pageWidth < 10:
        pageWidth = 10
    # First line is special
    if not firstLineWidth:
        firstLineWidth = pageWidth
    if firstLineWidth < 10:
        firstLineWidth = 10
    outputLineWidth = firstLineWidth
    # Sentence spacing
    # This should be determined by some setting, and can only be either 1 or 2
    sentenceSpacingWidth = 1
    assert 0 < sentenceSpacingWidth < 3
    result = []  # The lines of the result.
    line = ""  # The line being formed.  It never ends in whitespace.
    for s in lines:
        i = 0
        while i < len(s):
            assert len(line) <= outputLineWidth  # DTHEIN 18-JAN-2004
            j = g.skip_ws(s, i)
            k = g.skip_non_ws(s, j)
            word = s[j:k]
            assert k > i
            i = k
            # DTHEIN 18-JAN-2004: wrap at exactly the text width,
            # not one character less
            #
            wordLen = len(word)
            if line.endswith('.') or line.endswith('?') or line.endswith('!'):
                space = ' ' * sentenceSpacingWidth
            else:
                space = ' '
            if line and wordLen > 0:
                wordLen += len(space)
            if wordLen + len(line) <= outputLineWidth:
                if wordLen > 0:
                    //@+<< place blank and word on the present line >>
                    //@+node:felix.20220410213527.6: *5* << place blank and word on the present line >>
                    if line:
                        # Add the word, preceeded by a blank.
                        line = space.join((line, word))
                    else:
                        # Just add the word to the start of the line.
                        line = word
                    //@-<< place blank and word on the present line >>
                else: pass  # discard the trailing whitespace.
            else:
                //@+<< place word on a new line >>
                //@+node:felix.20220410213527.7: *5* << place word on a new line >>
                # End the previous line.
                if line:
                    result.append(line)
                    outputLineWidth = pageWidth  # DTHEIN 3-NOV-2002: width for remaining lines
                # Discard the whitespace and put the word on a new line.
                line = word
                # Careful: the word may be longer than pageWidth.
                if len(line) > pageWidth:  # DTHEIN 18-JAN-2004: line can equal pagewidth
                    result.append(line)
                    outputLineWidth = pageWidth  # DTHEIN 3-NOV-2002: width for remaining lines
                    line = ""
                //@-<< place word on a new line >>
    if line:
        result.append(line)
    return result
 */
//@+node:felix.20220410213527.8: *4* g.get_leading_ws
/*
def get_leading_ws(s: str) -> str:
    """Returns the leading whitespace of 's'."""
    i = 0
    n = len(s)
    while i < n and s[i] in (' ', '\t'):
        i += 1
    return s[0:i]
 */
//@+node:felix.20220410213527.9: *4* g.optimizeLeadingWhitespace

/**
 *
 * Optimize leading whitespace in s with the given tab_width.
 */
export function optimizeLeadingWhitespace(
    line: string,
    tab_width: number
): string {
    let i, width;
    [i, width] = skip_leading_ws_with_indent(line, 0, tab_width);
    const s = computeLeadingWhitespace(width, tab_width) + line.substring(i);
    return s;
}
//@+node:felix.20220410213527.10: *4* g.regularizeTrailingNewlines

//@+at The caller should call g.stripBlankLines before calling this routine
// if desired.
//
// This routine does _not_ simply call rstrip(): that would delete all
// trailing whitespace-only lines, and in some cases that would change
// the meaning of program or data.
//@@c
/*
def regularizeTrailingNewlines(s: str, kind: str) -> None:
    """Kind is 'asis', 'zero' or 'one'."""
    pass
 */
//@+node:felix.20220410213527.11: *4* g.removeBlankLines
export function removeBlankLines(s: string): string {
    let lines = splitLines(s);
    lines = lines.filter((z) => !!z.trim()); // [z for z in lines if z.strip()]
    return lines.join('');
}
//@+node:felix.20220410213527.12: *4* g.removeLeadingBlankLines
export function removeLeadingBlankLines(s: string): string {
    let lines = splitLines(s);
    const result = [];
    let remove = true;
    for (let line of lines) {
        if (remove && !line.trim()) {
            // pass
        } else {
            remove = false;
            result.push(line);
        }
    }
    return result.join('');
}
/*
def removeLeadingBlankLines(s: str) -> str:
    lines = g.splitLines(s)
    result = []
    remove = True
    for line in lines:
        if remove and not line.strip():
            pass
        else:
            remove = False
            result.append(line)
    return ''.join(result)
 */
//@+node:felix.20220410213527.13: *4* g.removeLeadingWhitespace

/**
 * Remove whitespace up to first_ws wide in s, given tab_width, the width of a tab.
 */
export function removeLeadingWhitespace(
    s: string,
    first_ws: number,
    tab_width: number
): string {
    let j = 0;
    let ws = 0;
    first_ws = Math.abs(first_ws);
    for (const ch of s) {
        if (ws >= first_ws) {
            break;
        } else if (ch === ' ') {
            j += 1;
            ws += 1;
        } else if (ch === '\t') {
            j += 1;
            ws += Math.abs(tab_width) - (ws % Math.abs(tab_width));
        } else {
            break;
        }
    }
    if (j > 0) {
        s = s.substring(j);
    }
    return s;
}
//@+node:felix.20220410213527.14: *4* g.removeTrailingWs
/*
# Warning: string.rstrip also removes newlines!

def removeTrailingWs(s: str) -> str:
    j = len(s) - 1
    while j >= 0 and (s[j] == ' ' or s[j] == '\t'):
        j -= 1
    return s[: j + 1]
 */
//@+node:felix.20220410213527.15: *4* g.skip_leading_ws
/*
# Skips leading up to width leading whitespace.

def skip_leading_ws(s: str, i: int, ws: int, tab_width: int) -> int:
    count = 0
    while count < ws and i < len(s):
        ch = s[i]
        if ch == ' ':
            count += 1
            i += 1
        elif ch == '\t':
            count += (abs(tab_width) - (count % abs(tab_width)))
            i += 1
        else: break
    return i
 */
//@+node:felix.20220410213527.16: *4* g.skip_leading_ws_with_indent
/*
/**
 * Skips leading whitespace and returns (i, indent),
 *
 * - i points after the whitespace
 * - indent is the width of the whitespace, assuming tab_width wide tabs.
 */
export function skip_leading_ws_with_indent(
    s: string,
    i: number,
    tab_width: number
): [number, number] {
    let count = 0;
    const n = s.length;
    while (i < n) {
        const ch = s[i];
        if (ch === ' ') {
            count += 1;
            i += 1;
        } else if (ch === '\t') {
            count += Math.abs(tab_width) - (count % Math.abs(tab_width));
            i += 1;
        } else {
            break;
        }
    }
    return [i, count];
}

//@+node:felix.20220410213527.17: *4* g.stripBlankLines
/*
def stripBlankLines(s: str) -> str:
    lines = g.splitLines(s)
    for i, line in enumerate(lines):
        j = g.skip_ws(line, 0)
        if j >= len(line):
            lines[i] = ''
        elif line[j] == '\n':
            lines[i] = '\n'
    return ''.join(lines)
 */
//@+node:felix.20220213223330.1: *3* g.isValidEncoding
/**
 * Return True if the encooding is valid.
 */
export function isValidEncoding(encoding: string): boolean {
    // ! TEMPORARY !
    if (!encoding) {
        return false;
    }
    if (encoding.toLowerCase() === 'utf-8') {
        return true;
    }
    return false;

    // try:
    //     codecs.lookup(encoding)
    //     return True
    // except LookupError:  # Windows
    //     return false
    // except AttributeError:  # Linux
    //     return false
    // except Exception:
    //     // UnicodeEncodeError
    //     g.es_print('Please report the following error')
    //     g.es_exception()
    //     return false
}

//@+node:felix.20211104230158.1: *3* g.toEncodedString (coreGlobals.py)
/**
 * Convert unicode string to an encoded string.
 */
export function toEncodedString(
    s: any,
    encoding: BufferEncoding = 'utf-8',
    reportErrors = false
): Uint8Array {
    return Buffer.from(s, encoding);
    // if ((typeof s) !== "string") {
    //     return s;
    // }
    // TODO : TEST AND CHECK IF MORE THAN utf-8 IS NEEDED
    // use atob() for ascii to base 64, or other functionality for more encodings
    // (other examples)
    //     btoa(unescape(encodeURIComponent(str))))
    //     decodeURIComponent(JSON.parse('"' + s.replace('"', '\\"') + '"'));
    // OTHER EXAMPLES
    // str.replace(/[^\0-~]/g, function(ch) {
    //     return "\\u" + ("000" + ch.charCodeAt().toString(16)).slice(-4);
    // });

    // ORIGINAL
    // * These are the only significant calls to s.encode in Leo.
    // try:
    //     s = s.encode(encoding, "strict")
    // except UnicodeError:
    //     s = s.encode(encoding, "replace")
    //     if reportErrors:
    //         error(f"Error converting {s} from unicode to {encoding} encoding")

    // return s; // skip for now
}

//@+node:felix.20211104210858.1: ** g.Logging & Printing
//@+node:felix.20211104212644.1: *3* g.doKeywordArgs
/**
 * Return a result dict that is a copy of the keys dict
 * with missing items replaced by defaults in d dict.
 */
export function doKeywordArgs(
    keys: { [key: string]: any },
    d: { [key: string]: any } = {}
): { [key: string]: any } {
    if (d === null) {
        d = {}; // May be unnecessary
    }
    const result: { [key: string]: any } = {};

    for (var key in d) {
        if (d.hasOwnProperty(key)) {
            const default_val = d[key];

            const isBool: boolean = [true, false].includes(default_val);
            const val: any = keys.hasOwnProperty(key) ? keys[key] : null;

            if (isBool && [true, 'True', 'true'].includes(val)) {
                result[key] = true;
            } else if (isBool && [false, 'False', 'false'].includes(val)) {
                result[key] = false;
            } else if (val === null) {
                result[key] = default_val;
            } else {
                result[key] = val;
            }
        }
    }

    return result;
}

//@+node:felix.20211104212837.1: *3* g.error, g.note, g.warning, g.red, g.blue
// TODO : Replace with proper method
export const blue = es_print;
export const error = es_print;
export const note = es_print;
export const red = es_print;
export const warning = es_print;

//@+node:felix.20211104212741.1: *3* g.es
export function es(...args: any[]): void {
    if (app && app.gui) {
        let s: string = '';
        args.forEach((p_entry) => {
            if (s) {
                s += ' ';
            }
            if (typeof p_entry === 'string' || p_entry instanceof String) {
                // it's a string
                s += p_entry;
            } else {
                if (p_entry !== undefined) {
                    s += p_entry.toString();
                } else {
                    s += 'undefined';
                }
            }
        });
        app.gui.addLogPaneEntry(s);
    } else {
        console.log(...args);
    }
}

//@+node:felix.20220419215939.1: *3* g.es_dump
export function es_dump(s: string, n: number = 30, title?: string): void {
    if (title) {
        es_print('', title);
    }
    let i = 0;
    while (i < s.length) {
        const s2 = s.slice(i, i + n);
        const aList: string[] = []; //  ''.join([`${ord(ch)} ` for ch in s[i : i + n]]);
        for (var j = 0; j < s2.length; j++) {
            aList.push(`${s2.charAt(j).charCodeAt(0)} `);
        }
        es_print('', aList.join(''));
        i += n;
    }
}

//@+node:felix.20220419221016.1: *3* g.es_error & es_print_error
export function es_error(...args: any[]): void {
    // color = keys.get('color')
    //if color is None and g.app.config:
    //    keys['color'] = g.app.config.getColor("log-error-color") or 'red'
    es(...args);
}
export function es_print_error(...args: any[]): void {
    // color = keys.get('color')
    //if color is None and g.app.config:
    //    keys['color'] = g.app.config.getColor("log-error-color") or 'red'
    es_print(...args);
}
//@+node:felix.20211104212802.1: *3* g.es_exception
export function es_exception(p_error?: any, c?: Commands): string {
    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: string, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    };

    // p_error = JSON.stringify(p_error, getCircularReplacer());
    es_print_error('es_exception called with error: ', p_error);
    return '<no file>';
}

/*
    ### es_exception Old code
        # typ, val, tb = sys.exc_info()
        # # val is the second argument to the raise statement.
        # if full:
            # lines = traceback.format_exception(typ, val, tb)
        # else:
            # lines = traceback.format_exception_only(typ, val)
        # for line in lines:
            # g.es_print_error(line, color=color)
        # fileName, n = g.getLastTracebackFileAndLineNumber()
        # return fileName, n
*/

//@+node:felix.20211104212809.1: *3* g.es_print
/**
 * Print all non-keyword args, and put them to the log pane.
 */
export function es_print(...args: any[]): void {
    pr(...args);
    if (app && app.gui && !unitTesting) {
        es(...args);
    }
}
//@+node:felix.20211227232452.1: *3* g.internalError
/**
 * Report a serious internal error in Leo.
 */
export function internalError(...args: any[]): void {
    const w_callers: any = callers(20).split(',');
    const caller: string = w_callers[w_callers.length - 1];
    error('\nInternal Leo error in', caller);
    es_print(...args);
    // es_print('Called from', ', '.join(callers[:-1]))
    // es_print('Please report this error to Leo\'s developers', 'red');
    es_print('Please report this error to LeoJS developers');
}
//@+node:felix.20211104222740.1: *3* g.pr
/**
 * Print all non-keyword args.
 */
export const pr = console.log;
// TODO : Replace with output to proper 'Leo terminal output'
// def pr(*args, **keys):
//     """ Print all non-keyword args."""
//     result = []
//     for arg in args:
//         if isinstance(arg, str):
//             result.append(arg)
//         else:
//             result.append(repr(arg))
//     print(','.join(result))

//@+node:felix.20230518224754.1: *3* g.print_exception
/**
 * Print exception info about the last exception.
 */
export function print_exception(
    p_exception: any
    // full: bool = True,
    // c: Cmdr = None,
    // flush: bool = False,
    // color: str = "red",
): void {
    console.log(p_exception.toString());
    // val is the second argument to the raise statement.
    // typ, val, tb = sys.exc_info()
    // if full:
    //     lines = traceback.format_exception(typ, val, tb)
    // else:
    //     lines = traceback.format_exception_only(typ, val)
    // print(''.join(lines), flush=flush)
    // try:
    //     fileName, n = g.getLastTracebackFileAndLineNumber()
    //     return fileName, n
    // except Exception:
    //     return "<no file>", 0
}
//@+node:felix.20211104230337.1: *3* g.trace
/**
 * Print a tracing message
 */
export const trace = console.log;
// TODO : Replace with output to proper 'Leo terminal output'

//@+node:felix.20211104211115.1: ** g.Miscellaneous
//@+node:felix.20230529144955.1: *3* g.maketrans
export function maketrans(
    from: string,
    to: string,
    deletechars?: string
): Record<number, string | null> {
    const translationTable: Record<number, string | null> = {};
    const maxLength = Math.min(from.length, to.length);

    for (let i = 0; i < maxLength; i++) {
        translationTable[from.charCodeAt(i)] = to.charAt(i);
    }

    if (deletechars) {
        for (let i = 0; i < deletechars.length; i++) {
            const charCode = deletechars.charCodeAt(i);
            translationTable[charCode] = null; // Mark for deletion
        }
    }

    return translationTable;
}
//@+node:felix.20230529152331.1: *3* g.maketrans_from_dict
/**
 * Converts dict to numeric charCode keys, Warning: don't use if keys already numeric!
 * @param dict With only strings as keys! Dont use if already numeric keys!
 * @returns dict with charCode number as keys.
 */
export function maketrans_from_dict(
    dict: Record<string, string | null>
): Record<number, string | null> {
    const translationTable: Record<number, string | null> = {};

    for (const key in dict) {
        if (dict.hasOwnProperty(key)) {
            let charCode;
            // ! IF ALREADY A NUMBER KEY : KEEP THIS KEY!
            // (see https://www.programiz.com/python-programming/methods/string/maketrans
            //  and look for call with single parameter)
            if (typeof key === 'number') {
                charCode = key;
            } else {
                // string
                charCode = key.charCodeAt(0);
            }
            translationTable[charCode] = dict[key];
        }
    }

    return translationTable;
}
//@+node:felix.20230529144946.1: *3* g.translate
export function translate(
    text: string,
    translationTable: Record<number, string | null>
): string {
    let translatedText = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const translation = translationTable[charCode];
        if (translation !== null) {
            translatedText += translation || text.charAt(i);
        }
    }
    return translatedText;
}
//@+node:felix.20230530001033.1: *3* g.compareArrays
export function compareArrays(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    return arr1.every((value, index) => value === arr2[index]);
}
//@+node:felix.20230530135543.1: *3* g.comparePositionArray
export function comparePositionArray(
    arr1: Position[],
    arr2: Position[]
): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    return arr1.every((val1, index) => {
        const val2 = arr2[index];
        if (val1 && val1.__bool__() && val2 && val2.__bool__()) {
            return val1.__eq__(val2);
        } else {
            // some don't exist... are they the same in some way?
            // no 'v' to check so default to 'false'.
            return false;
        }
    });
}
//@+node:felix.20221017010728.1: *3* g.process_time
/**
 * python process_time equivalent that returns the current timestamp in SECONDS
 */
export function process_time(): number {
    const w_now = process.hrtime();
    const [w_secs, w_nanosecs] = w_now;
    return w_secs * 1.0 + Math.floor(w_nanosecs / 1000);
}
//@+node:felix.20220611031515.1: *3* g.convertPythonDayjs
export function convertPythonDayjs(s: string): string {
    const table: [string, string][] = [
        ['%a', 'ddd'], // %a    Abbreviated weekday name.	Sun, Mon, ...
        ['%A', 'dddd'], // %A    Full weekday name.	Sunday, Monday, ...
        ['%w', 'd'], // %w    Weekday as a decimal number.	0, 1, ..., 6
        ['%d', 'DD'], // %d    Day of the month as a zero-padded decimal.	01, 02, ..., 31
        ['%-d', 'D'], // %-d  Day of the month as a decimal number.	1, 2, ..., 30
        ['%b', 'MMM'], // %b    Abbreviated month name.	Jan, Feb, ..., Dec
        ['%B', 'MMMM'], // %B    Full month name.	January, February, ...
        ['%m', 'MM'], // %m    Month as a zero-padded decimal number.	01, 02, ..., 12
        ['%-m', 'M'], // %-m  Month as a decimal number.	1, 2, ..., 12
        ['%y', 'YY'], // %y    Year without century as a zero-padded decimal number.	00, 01, ..., 99
        ['%-y', ''], // %-y  Year without century as a decimal number.	0, 1, ..., 99
        ['%Y', 'YYYY'], // %Y    Year with century as a decimal number.	2013, 2019 etc.
        ['%H', 'HH'], // %H    Hour (24-hour clock) as a zero-padded decimal number.	00, 01, ..., 23
        ['%-H', 'H'], // %-H  Hour (24-hour clock) as a decimal number.	0, 1, ..., 23
        ['%I', 'hh'], // %I    Hour (12-hour clock) as a zero-padded decimal number.	01, 02, ..., 12
        ['%-I', 'h'], // %-I  Hour (12-hour clock) as a decimal number.	1, 2, ... 12
        ['%p', 'A'], // %p    Locale’s AM or PM.	AM, PM
        ['%M', 'mm'], // %M    Minute as a zero-padded decimal number.	00, 01, ..., 59
        ['%-M', 'm'], // %-M  Minute as a decimal number.	0, 1, ..., 59
        ['%S', 'ss'], // %S    Second as a zero-padded decimal number.	00, 01, ..., 59
        ['%-S', 's'], // %-S  Second as a decimal number.	0, 1, ..., 59
        ['%f', ''], // %f    Microsecond as a decimal number, zero-padded on the left.	000000 - 999999
        ['%z', 'ZZ'], // %z    UTC offset in the form +HHMM or -HHMM.
        ['%Z', ''], // %Z    Time zone name.
        ['%j', ''], // %j    Day of the year as a zero-padded decimal number.	001, 002, ..., 366
        ['%-j', ''], // %-j  Day of the year as a decimal number.	1, 2, ..., 366
        ['%U', ''], // %U    Week number of the year (Sunday as the first day of the week). All days in a new year preceding the first Sunday are considered to be in week 0.	00, 01, ..., 53
        ['%W', ''], // %W    Week number of the year (Monday as the first day of the week). All days in a new year preceding the first Monday are considered to be in week 0.	00, 01, ..., 53
        ['%c', 'LLLL'], // %c    Locale’s appropriate date and time representation.	Mon Sep 30 07:06:05 2013
        ['%x', 'L'], // %x    Locale’s appropriate date representation.	09/30/13
        ['%X', 'LTS'], // %X    Locale’s appropriate time representation.	07:06:05
        ['%%', '%'], // %%    A literal '%' character.
    ];

    for (const pair of table) {
        if (pair[1]) {
            s = s.split(pair[0]).join(pair[1]);
        }
    }

    return s;
}

//@+node:felix.20230611195053.1: *3* g.dedent
/**
 * Implementation of Python's "textwrap.dedent" function
 */
export function dedent(text: string): string {
    const whitespaceOnlyRe = /^[ \t]+$/gm;
    const leadingWhitespaceRe = /^(^[ \t]*)(?:[^ \t\n])/gm;

    let margin = null;
    text = text.replace(whitespaceOnlyRe, '');
    const indents = text.match(leadingWhitespaceRe) || [];
    for (let indent of indents) {
        indent = indent.slice(0, -1);
        if (margin === null) {
            margin = indent;
        } else if (indent.startsWith(margin)) {
            continue;
        } else if (margin.startsWith(indent)) {
            margin = indent;
        } else {
            for (let i = 0; i < margin.length; i++) {
                if (margin[i] !== indent[i]) {
                    margin = margin.substring(0, i);
                    break;
                }
            }
        }
    }

    if (margin) {
        const marginRe = new RegExp(`^${margin}`, 'gm');
        text = text.replace(marginRe, '');
    }

    return text;
}
//@+node:felix.20221218195057.1: *3* g.reEscape

/**
 * python re.escape equivalent in typescript
 */
export function reEscape(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
//@+node:felix.20221219233315.1: *3* g.ltrim
export function ltrim(str: string, ch: string): string {
    let i = 0;
    while (ch.includes(str.charAt(i)) && ++i && i < str.length) {
        // pass, the ++i expression is doing the job
    }
    return str.substring(i, str.length);
}
//@+node:felix.20230212205315.1: *3* g.rtrim
export function rtrim(str: string, ch: string): string {
    let i = str.length;
    while (i-- && ch.includes(str.charAt(i))) {
        // pass, the i-- expression is doing the job
    }
    return str.substring(0, i + 1);
}
//@+node:felix.20211104222646.1: *3* g.plural (coreGlobals.py)
/**
 * Return "s" or "" depending on n.
 */
export function plural(obj: any): string {
    let n: number;
    if (Array.isArray(obj) || typeof obj === 'string') {
        n = obj.length;
    } else if (typeof obj === 'object') {
        n = Object.keys(obj).length;
    } else {
        n = obj;
    }
    return n === 1 ? '' : 's';
}

//@+node:felix.20230501203659.1: *3* g.rjust
export function rjust(s: string, n: number, ch = ' '): string {
    if (s.length >= n) {
        return s;
    } else {
        const pad = ch.repeat(n - s.length);
        return pad + s;
    }
}
//@+node:felix.20230220001637.1: *3* g.useSyntaxColoring
/**
 * True if p's parents enable coloring in p.
 */
export function useSyntaxColoring(p: Position): boolean {
    // Special cases for the selected node.
    let d = findColorDirectives(p);
    if (d.includes('killcolor')) {
        return false;
    }
    if (d.includes('nocolor-node')) {
        return false;
    }
    // Now look at the parents.
    for (const w_p of p.parents()) {
        d = findColorDirectives(w_p);

        // @killcolor anywhere disables coloring.
        if (d.includes('killcolor')) {
            return false;
        }
        // unambiguous @color enables coloring.
        if (d.includes('color') && !d.includes('nocolor')) {
            return true;
        }
        // Unambiguous @nocolor disables coloring.
        if (d.includes('nocolor') && !d.includes('color')) {
            return false;
        }
    }
    return true;
}
//@+node:felix.20230220001655.1: *3* g.findColorDirectives
/**
 * Return an array with each color directive in p.b, without the leading '@'.
 */
export function findColorDirectives(p: Position): string[] {
    const d = p.b.match(color_directives_pat) || [];

    return d.map((s: string) => {
        return s.substring(1);
    });
}
//@+node:felix.20230420214829.1: *3* g.divmod
export function divmod(dividend: number, divisor: number): [number, number] {
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    return [quotient, remainder];
}
//@+node:felix.20230516013609.1: *3* g.os_listdir
export async function os_listdir(p_path: string): Promise<string[]> {
    let result: string[] = [];
    try {
        const w_uri = makeVscodeUri(p_path);
        const w_dirInfo = await vscode.workspace.fs.readDirectory(w_uri);
        result = w_dirInfo.map((p_dirInfo) => p_dirInfo[0]);
    } catch (e) {
        es(`Error listing directory ${p_path}`);
    }
    return result;
}
//@+node:felix.20230711005109.1: *3* g.setStatusLabel
export function setStatusLabel(s: string): Thenable<unknown> {
    return vscode.window.showInformationMessage(s);
}
//@+node:felix.20230624200527.1: *3* g.warnNoOpenDirectory
/**
 * Give warning when trying to refresh or write external files
 * and c.openDirectory is undefined.
 * Occurs when new & unsaved leo document, along with no vscode workspace opened
 */
export function warnNoOpenDirectory(
    p_items?: string[]
): Thenable<string | undefined> {
    const w_message =
        'Directory for this outline is undefined\n' +
        'Save it first, or open a VSCode workspace.';

    let q_warning: Thenable<string | undefined>;

    if (p_items && p_items.length) {
        q_warning = vscode.window.showWarningMessage(w_message, ...p_items);
    } else {
        q_warning = vscode.window.showWarningMessage(
            w_message,
            'Save',
            'Open Folder'
        );
    }
    return q_warning.then((p_result) => {
        // handle choices
        if (p_result === 'Save') {
            void vscode.commands.executeCommand('leojs.saveLeoFile');
        } else if (p_result === 'Open Folder') {
            if (isBrowser) {
                void vscode.commands.executeCommand('remoteHub.openRepository');
            } else {
                void vscode.commands.executeCommand(
                    'workbench.action.files.openFolder'
                );
            }
        }
        return p_result;
    });
}
//@+node:felix.20230426001612.1: *3* g.zip
export function zip<T>(...arrays: T[][]): T[][] {
    const length = Math.min(...arrays.map((arr) => arr.length));
    return Array.from({ length }, (_, i) => arrays.map((arr) => arr[i]));
}
//@+node:felix.20211227182611.1: ** g.os_path_ Wrappers
//@+at Note: all these methods return Unicode strings. It is up to the user to
// convert to an encoded string as needed, say when opening a file.
//@+node:felix.20230422214424.1: *3* g.finalize
/**
 *
 * Finalize the path. Do not call os.path.realpath.
 *
 * - Call os.path.expanduser and os.path.expandvars.
 * - Convert to an absolute path, relative to os.getwd().
 * - On Windows, convert backslashes to forward slashes.
 */
export function finalize(p_path: string): string {
    if (!p_path) {
        return '';
    }
    // p_path = os.path.expanduser(p_path)
    p_path = os_path_expanduser(p_path);

    // Equivalent to python's p_path = os.path.expandvars(p_path)
    p_path = os_path_expandvars(p_path);

    // Convert to an absolute path, similar to os.path.normpath(os.getcwd(), path)
    // p_path = os.path.abspath(p_path)
    p_path = path.resolve(p_path);

    // p_path = os.path.normpath(p_path)
    p_path = path.normalize(p_path);

    // Convert backslashes to forward slashes, regradless of platform.
    p_path = os_path_normslashes(p_path);
    return p_path;
}

export const os_path_finalize = finalize; // Compatibility.

//@+node:felix.20230422214428.1: *3* g.finalize_join
/**
 * Join and finalize. Do not call os.path.realpath.
 *
 * - Return an empty string if all of the args are empty.
 * - Call os.path.expanduser and  os.path.expandvars for each arg.
 * - Call os.path.join on the resulting list of expanded arguments.
 * - Convert to an absolute path, relative to os.getwd().
 * - On Windows, convert backslashes to forward slashes.
 */
export function finalize_join(...args: string[]): string {
    if (!args || !args.length) {
        return '';
    }

    const uargs: string[] = [];
    for (let z of args) {
        if (z) {
            z = os_path_expanduser(z);
            z = os_path_expandvars(z);
            uargs.push(z);
        }
    }

    if (!uargs.length) {
        return '';
    }

    // Join the paths.
    let w_path = PYTHON_os_path_join(...uargs);

    // Convert to an absolute path, similar to os.path.normpath(os.getcwd(), path)
    // w_path = os.path.abspath(w_path)
    // w_path = os.path.normpath(w_path)

    w_path = path.resolve(w_path);
    w_path = path.normalize(w_path);

    // Convert backslashes to forward slashes, regradless of platform.
    w_path = os_path_normslashes(w_path);
    return w_path;
}

export const os_path_finalize_join = finalize_join; // Compatibility.
//@+node:felix.20211227182611.2: *3* g.glob_glob
// def glob_glob(pattern):
//     """Return the regularized glob.glob(pattern)"""
//     aList = glob.glob(pattern)
//     # os.path.normpath does the *reverse* of what we want.
//     if g.isWindows:
//         aList = [z.replace('\\', '/') for z in aList]
//     return aList
//@+node:felix.20211227182611.3: *3* g.os_path_abspath
/**
 * Convert a path to an absolute path.
 */
export function os_path_abspath(p_path: string): string {
    if (!p_path) {
        return '';
    }

    if (p_path.includes('\x00')) {
        trace('NULL in', p_path.toString(), callers());
        p_path = p_path.split('\x00').join(''); // Fix Python 3 bug on Windows 10.
    }

    p_path = path.resolve(p_path);

    // os.path.normpath does the *reverse* of what we want.
    if (isWindows) {
        p_path = p_path.split('\\').join('/');
    }
    return p_path;
}

//@+node:felix.20211227182611.4: *3* g.os_path_basename
/**
 * Return the second half of the pair returned by split(path).
 */
export function os_path_basename(p_path: string): string {
    if (!p_path) {
        return '';
    }
    p_path = path.basename(p_path);
    p_path = os_path_normslashes(p_path);
    return p_path;
}
//@+node:felix.20211227205112.1: *3* g.os_path_dirname
/**
 * Return the first half of the pair returned by split(path).
 */
export function os_path_dirname(p_path?: string): string {
    if (!p_path) {
        return '';
    }

    p_path = path.dirname(p_path);
    // os.path.normpath does the *reverse* of what we want.

    if (isWindows) {
        p_path = p_path.split('\\').join('/');
    }

    return p_path;
}
//@+node:felix.20211227205124.1: *3* g.os_path_exists
/**
 * Return Truish FileStat if path exists. False otherwise
 */
export async function os_path_exists(
    p_path?: string
): Promise<boolean | vscode.FileStat> {
    if (!p_path) {
        return false;
    }
    if (p_path.includes('\x00')) {
        trace('NULL in', p_path.toString(), callers());
        p_path = p_path.split('\x00').join(''); // Fix Python 3 bug on Windows 10.
    }
    const w_uri = makeVscodeUri(p_path);
    try {
        const stat = await vscode.workspace.fs.stat(w_uri);
        return stat;
    } catch {
        return false;
    }
}
//@+node:felix.20211227182611.7: *3* g.os_path_expanduser
/**
 * wrap os.path.expanduser
 */
export function os_path_expanduser(p_path: string): string {
    p_path = p_path.trim();
    if (!p_path) {
        return '';
    }
    if (os && os.homedir && os.homedir()) {
        const homeDir = os.homedir();
        if (p_path === '~') {
            return homeDir;
        } else if (p_path.startsWith('~/')) {
            p_path = p_path.replace('~', homeDir);
        }
        if (isWindows) {
            if (p_path.startsWith('~\\')) {
                p_path = p_path.replace('~', homeDir);
            }
            p_path = p_path.replace('\\\\', '\\');
        }
        p_path = p_path.replace('//', '/');
    }
    return p_path;

    // DEPRECATED

    // p_path = p_path.trim();
    // if (!p_path) {
    //     return '';
    // }

    // // os.path.expanduser(p_path)
    // if (p_path[0] === '~') {
    //     p_path = path.join(os.homedir(), p_path.slice(1));
    // }
    // let result: string = path.normalize(p_path);

    // // os.path.normpath does the *reverse* of what we want.
    // if (isWindows) {
    //     result = result.split('\\').join('/');
    // }
    // return result;
}
//@+node:felix.20230527201323.1: *3* g.os_path_expandvars
export function os_path_expandvars(p_path: string): string {
    if (!p_path) {
        return '';
    }
    if (process && process.env) {
        // Equivalent to python's p_path = os.path.expandvars(p_path)
        // which replaces both $MY_VAR and ${MY_VAR} forms.

        p_path = p_path.replace(
            /\${([A-Za-z_][A-Za-z0-9_]*)}/g,
            (match, varName) => {
                return process.env[varName] || '';
            }
        );

        p_path = p_path.replace(
            /\$([A-Za-z_][A-Za-z0-9_]*)/g,
            (match, varName) => {
                return process.env[varName] || '';
            }
        );
    }
    return p_path;
}
//@+node:felix.20211227182611.10: *3* g.os_path_getmtime
/**
 * Return the modification time of path.
 */
export async function os_path_getmtime(p_path: string): Promise<number> {
    if (!p_path) {
        return 0;
    }
    try {
        // return os.path.getmtime(p_path);
        const w_uri = makeVscodeUri(p_path);
        const w_stats = await vscode.workspace.fs.stat(w_uri);
        return w_stats.mtime;
    } catch (exception) {
        return 0;
    }
}
//@+node:felix.20211227182611.11: *3* g.os_path_getsize
/**
 * Return the size of path.
 */
export async function os_path_getsize(p_path: string): Promise<number> {
    if (p_path) {
        const w_uri = makeVscodeUri(p_path);
        try {
            const fileStat: vscode.FileStat = await vscode.workspace.fs.stat(
                w_uri
            );
            // OK exists
            return fileStat.size;
        } catch {
            // Does not exist !
            return 0;
        }
    } else {
        return 0;
    }
}

//@+node:felix.20211227205142.1: *3* g.os_path_isabs
/**
 * Return True if path is an absolute path.
 */
export function os_path_isabs(p_path: string): boolean {
    if (p_path) {
        return path.isAbsolute(p_path);
    } else {
        return false;
    }
}
//@+node:felix.20211227182611.13: *3* g.os_path_isdir
/**
 * Return True if the path is a directory.
 */
export async function os_path_isdir(p_path: string): Promise<boolean> {
    if (p_path) {
        try {
            const w_uri = makeVscodeUri(p_path);
            const fileStat: vscode.FileStat = await vscode.workspace.fs.stat(
                w_uri
            );
            // OK exists
            return fileStat.type === vscode.FileType.Directory;
        } catch {
            // Does not exist !
            return false;
        }
    } else {
        return false;
    }
}

//@+node:felix.20211227182611.14: *3* g.os_path_isfile
/**
 * Return True if path is a file.
 */
export async function os_path_isfile(p_path?: string): Promise<boolean> {
    if (p_path) {
        try {
            const w_uri = makeVscodeUri(p_path);
            const fileStat: vscode.FileStat = await vscode.workspace.fs.stat(
                w_uri
            );
            // OK exists
            return fileStat.type === vscode.FileType.File;
        } catch {
            // Does not exist !
            return false;
        }
    } else {
        return false;
    }
}
//@+node:felix.20230608221301.1: *3* g.PYTHON_os_path_join
/**
 * PYTHON'S OS PATH JOIN !
 * os.path.join(path, *paths)
 *
 * Join one or more path segments intelligently. The return value is the concatenation
 * of path and all members of *paths, with exactly one directory separator following
 * each non-empty part, except the last.
 *
 * That is, the result will only end in a separator
 * if the last part is either empty or ends in a separator.
 *
 * If a segment is an absolute path (which on Windows requires both a drive and a root),
 * then all previous segments are ignored and joining continues from the absolute path segment.
 *
 * On Windows, the drive is not reset when a rooted path segment (e.g., r'\foo') is encountered.
 *
 * If a segment is on a different drive or is an absolute path, all previous segments
 * are ignored and the drive is reset.
 *
 * Note that since there is a current directory for each drive,
 * os.path.join("c:", "foo") represents a path relative to the current
 * directory on drive C: (c:foo), not c:\foo.
 */
export function PYTHON_os_path_join(...args: any[]): string {
    let uargs: string[] = [];
    for (let z of args) {
        if (z) {
            if (path.isAbsolute(z)) {
                uargs = [];
            }
            uargs.push(z);
        }
    }
    if (!uargs.length) {
        return '';
    }
    let w_path = path.join(...uargs);
    return w_path;
}
//@+node:felix.20211227182611.15: *3* g.os_path_join
/**
 * Join paths, like os.path.join, with enhancements:
 *
 * A '!!' arg prepends g.app.loadDir to the list of paths.
 * A '.'  arg prepends c.openDirectory to the list of paths,
 * provided there is a 'c' kwarg.
 */
export function os_path_join(...args: any[]): string {
    const uargs: string[] = [];
    for (let z of args) {
        if (z) {
            uargs.push(z);
        }
    }
    if (!uargs.length) {
        return '';
    }
    let w_path = PYTHON_os_path_join(...uargs);
    w_path = os_path_normslashes(w_path);
    return w_path;
}
//@+node:felix.20211227182611.16: *3* g.os_path_normcase
/**
 * Normalize the path's case.
 */
export function os_path_normcase(p_path: string): string {
    if (!p_path) {
        return '';
    }
    if (isWindows) {
        p_path = p_path.toLowerCase();
    }
    p_path = os_path_normslashes(p_path);
    return p_path;
}
//@+node:felix.20211227182611.17: *3* g.os_path_normpath
/**
 * Normalize the path.
 */
export function os_path_normpath(p_path: string): string {
    if (!p_path) {
        return '';
    }
    p_path = path.normalize(p_path);
    // os.path.normpath does the *reverse* of what we want.
    // if (isWindows) {
    //     p_path = p_path.split('\\').join('/').toLowerCase();
    // }
    p_path = os_path_normslashes(p_path);
    return p_path;
}

//@+node:felix.20211227182611.18: *3* g.os_path_normslashes
/**
 * Convert backslashes to forward slashes (Windows only).
 *
 * In effect, this convert Windows paths to POSIX paths.
 */
export function os_path_normslashes(p_path: string): string {
    if (!p_path) {
        return '';
    }
    if (isWindows) {
        p_path = p_path.split('\\').join('/');
    }
    return p_path;
}
//@+node:felix.20211227182611.19: *3* g.os_path_realpath
/**
 * Return the canonical path of the specified filename, eliminating any
 * symbolic links encountered in the path (if they are supported by the
 * operating system).
 */
export function os_path_realpath(p_path: string): string {
    if (!p_path) {
        return '';
    }

    // TODO : better os_path_realpath !
    // console.log('Todo: better os_path_realpath!');

    p_path = p_path; // fixme
    // p_path = vscode.workspace.fs.realPath(p_path);
    // // os.path.normpath does the *reverse* of what we want.

    p_path = os_path_normslashes(p_path);
    return p_path;
}

//@+node:felix.20230423204948.1: *3* g.os_path_samefile
export async function os_path_samefile(
    fn1: string,
    fn2: string
): Promise<boolean> {
    // 1- with string themselves
    if (
        os_path_normpath(os_path_normcase(fn1)) ===
        os_path_normpath(os_path_normcase(fn2))
    ) {
        return true;
    }

    // 2- with fs.stat ino and dev
    const w_uri1 = makeVscodeUri(fn1);
    const w_uri2 = makeVscodeUri(fn2);

    // 2.5 with vscode.Uri :
    //  path
    //  fsPath
    //  toString
    if (
        w_uri1.path === w_uri2.path ||
        w_uri1.fsPath === w_uri2.fsPath ||
        w_uri1.toString() === w_uri2.path.toString()
    ) {
        return true;
    }

    // IF REAL NODE FS ONLY !
    try {
        const w_stat1: vscode.FileStat = await vscode.workspace.fs.stat(w_uri1);
        const w_stat2: vscode.FileStat = await vscode.workspace.fs.stat(w_uri2);
        if (
            (w_stat1 as any)['ino'] &&
            (w_stat1 as any)['dev'] &&
            (w_stat2 as any)['ino'] &&
            (w_stat2 as any)['dev']
        ) {
            if (
                (w_stat1 as any)['ino'] === (w_stat2 as any)['ino'] &&
                (w_stat1 as any)['dev'] === (w_stat2 as any)['dev']
            ) {
                return true;
            }
        }
    } catch (e) {
        // A file didnt exist!
        return false;
    }

    // 3- with path.resolve
    let absPath1 = path.resolve(fn1);
    let absPath2 = path.resolve(fn2);
    if (absPath1 === absPath2) {
        return true;
    }

    // 4- with fs.realpath
    // DOES NOT EXIST IN VSCODE vscode.workspace.fs !

    // 5- finalize
    absPath1 = finalize(fn1);
    absPath2 = finalize(fn2);
    return fn1 === fn2;
}
//@+node:felix.20211227182611.20: *3* g.os_path_split
export function os_path_split(p_path: string): [string, string] {
    /*
     Mimics this behavior from
     https://docs.python.org/3/library/os.path.html#os.path.split

     Split the pathname path into a pair, (head, tail)
     where tail is the last pathname component and head
     is everything leading up to that.

     The tail part will never contain a slash;
     if path ends in a slash, tail will be empty.
     If there is no slash in path, head will be empty.

     If path is empty, both head and tail are empty.

     Trailing slashes are stripped from head unless
     it is the root (one or more slashes only).

     In all cases, join(head, tail) returns a path to the
     same location as path (but the strings may differ).
    */

    if (!p_path || !p_path.trim()) {
        return ['', ''];
    }

    let testPath = p_path;
    if (isWindows) {
        testPath = testPath.split('\\').join('/');
    }

    if (testPath.includes('/')) {
        // at least a slash
        if (testPath.endsWith('/')) {
            // return with empty tail
            return [p_path, ''];
        }

        let w_parsed = path.parse(p_path);
        return [w_parsed.dir, w_parsed.base];
    } else {
        // no slashes
        return ['', p_path];
    }
}
//@+node:felix.20211227182611.21: *3* g.os_path_splitext

export function os_path_splitext(p_path: string): [string, string] {
    /*
        reproduces os.path.splitext from:
        https://docs.python.org/3/library/os.path.html#os.path.splitext


        Split the pathname path into a pair (root, ext)
        such that root + ext == path,
        and the extension, ext, is empty or begins with a period and
        contains at most one period.

        If the path contains no extension, ext will be '':

        If the path contains an extension, then ext will be set
        to this extension, including the leading period.
        Note that previous periods will be ignored

        Leading periods of the last component of the path
        are considered to be part of the root
    */

    if (!p_path || !p_path.trim()) {
        return ['', ''];
    }

    let head: string;
    let tail: string;

    if (p_path.includes('.')) {
        const parts = p_path.split('.');
        tail = parts.pop()!;
        head = parts.join('.');
        if (!head || head.endsWith('/') || head.endsWith('\\')) {
            // leading period
            return [p_path, ''];
        }
        // edge case
        if (head.endsWith('.')) {
            try {
                let w_parsed = path.parse(p_path);
                if (w_parsed.ext && !w_parsed.dir.endsWith('.')) {
                    return [
                        w_parsed.dir +
                        (isWindows && p_path.includes('\\') ? '\\' : '/') +
                        w_parsed.name,
                        w_parsed.ext,
                    ];
                } else {
                    return [p_path, ''];
                }
            } catch (error) {
                trace('PATH SPLIT ERROR in g.os_path_splitext', callers());
                return [p_path, ''];
            }
        }

        return [head, '.' + tail];
    } else {
        // no extension
        return [p_path, ''];
    }
}
//@+node:felix.20211227182611.22: *3* g.os_startfile
// def os_startfile(fname):
//     @others
//     if fname.find('"') > -1:
//         quoted_fname = f"'{fname}'"
//     else:
//         quoted_fname = f'"{fname}"'
//     if sys.platform.startswith('win'):
//         # pylint: disable=no-member
//         os.startfile(quoted_fname)
//             # Exists only on Windows.
//     elif sys.platform == 'darwin':
//         # From Marc-Antoine Parent.
//         try:
//             # Fix bug 1226358: File URL's are broken on MacOS:
//             # use fname, not quoted_fname, as the argument to subprocess.call.
//             subprocess.call(['open', fname])
//         catch OSError:
//             pass  # There may be a spurious "Interrupted system call"
//         catch ImportError:
//             os.system(f"open {quoted_fname}")
//     else:
//         try:
//             ree = None
//             wre = tempfile.NamedTemporaryFile()
//             ree = io.open(wre.name, 'rb', buffering=0)
//         catch IOError:
//             g.trace(f"error opening temp file for {fname!r}")
//             if ree:
//                 ree.close()
//             return
//         try:
//             subPopen = subprocess.Popen(['xdg-open', fname], stderr=wre, shell=False)
//         catch Exception:
//             g.es_print(f"error opening {fname!r}")
//             g.es_exception()
//         try:
//             itoPoll = g.IdleTime(
//                 (lambda ito: itPoll(fname, ree, subPopen, g, ito)),
//                 delay=1000,
//             )
//             itoPoll.start()
//             # Let the Leo-Editor process run
//             # so that Leo-Editor is usable while the file is open.
//         catch Exception:
//             g.es_exception(f"exception executing g.startfile for {fname!r}")
//@+node:felix.20211227182611.23: *4* stderr2log()
// def stderr2log(g, ree, fname):
//     """ Display stderr output in the Leo-Editor log pane

//     Arguments:
//         g:  Leo-Editor globals
//         ree:  Read file descriptor for stderr
//         fname:  file pathname

//     Returns:
//         None
//     """

//     while True:
//         emsg = ree.read().decode('utf-8')
//         if emsg:
//             g.es_print_error(f"xdg-open {fname} caused output to stderr:\n{emsg}")
//         else:
//             break
//@+node:felix.20211227182611.24: *4* itPoll()
// def itPoll(fname, ree, subPopen, g, ito):
//     """ Poll for subprocess done

//     Arguments:
//         fname:  File name
//         ree:  stderr read file descriptor
//         subPopen:  URL open subprocess object
//         g: Leo-Editor globals
//         ito: Idle time object for itPoll()

//     Returns:
//         None
//     """

//     stderr2log(g, ree, fname)
//     rc = subPopen.poll()
//     if not rc is None:
//         ito.stop()
//         ito.destroy_self()
//         if rc != 0:
//             g.es_print(f"xdg-open {fname} failed with exit code {rc}")
//         stderr2log(g, ree, fname)
//         ree.close()
//@+node:felix.20220411212559.1: ** g.Parsing & Tokenizing
//@+node:felix.20220411212559.2: *3* g.createTopologyList
/**
 * Creates a list describing a node and all its descendants
 */
export function createTopologyList(
    c: Commands,
    root?: Position,
    useHeadlines?: boolean
): any[] {
    if (!root) {
        root = c.rootPosition()!;
    }
    const v = root;
    let aList: any[];
    if (useHeadlines) {
        aList = [[v.numberOfChildren(), v.headString()]]; // type ignore
    } else {
        aList = [v.numberOfChildren()]; // type ignore
    }
    let child = v.firstChild();
    while (child && child.__bool__()) {
        aList.push(createTopologyList(c, child, useHeadlines)); // type ignore
        child = child.next();
    }

    return aList;
}
//@+node:felix.20220411212559.3: *3* g.getDocString
/**
 * Return the text of the first docstring found in s.
 */
export function getDocString(s: string): string {
    const tags = ['"""', "'''"];
    let tag1;
    let tag2;
    [tag1, tag2] = tags;

    let i1;
    let i2;
    [i1, i2] = [s.indexOf(tag1), s.indexOf(tag2)];

    if (i1 === -1 && i2 === -1) {
        return '';
    }
    let i: number;
    if (i1 > -1 && i2 > -1) {
        i = Math.min(i1, i2);
    } else {
        i = Math.max(i1, i2);
    }
    const tag = s.slice(i, i + 3);

    console.assert(tags.includes(tag));

    const j = s.indexOf(tag, i + 3);
    if (j > -1) {
        return s.slice(i + 3, j);
    }
    return '';
}
//@+node:felix.20220411212559.4: *3* g.getDocStringForFunction
/**
 * Return the docstring for a function that creates a Leo command.
 */
export function getDocStringForFunction(func: any): string {
    const name = (func: any): string => {
        if (func['__name__']) {
            return func['__name__'];
        } else {
            return '<no __name__>';
        }
        // return func.__name__ if hasattr(func, '__name__') else '<no __name__>'
    };

    // Fix bug 1251252: https://bugs.launchpad.net/leo-editor/+bug/1251252
    // Minibuffer commands created by mod_scripting.py have no docstrings.
    // Do special cases first.
    let s: string = '';

    // TODO: Special cases needed?
    /*
    const get_defaults = (func: string, i: number) : any => {
        const defaults = inspect.getfullargspec(func)[3];
        return defaults[i];
    };

    if (name(func) === 'minibufferCallback'){
        func = get_defaults(func, 0);
        if (hasattr(func, 'func.__doc__') && func.__doc__.trim()){
            s = func.__doc__;
        }
    }
    let script;
    if (!s && name(func) === 'commonCommandCallback'){
        script = get_defaults(func, 1);
        s = getDocString(script);  // Do a text scan for the function.
    }
    */

    // Now the general cases.  Prefer __doc__ to docstring()
    if (!s && func['__doc__']) {
        s = func.__doc__;
    }
    if (!s && func['docstring']) {
        s = func.docstring;
    }
    return s;
}
//@+node:felix.20220411212559.5: *3* g.python_tokenize (not used)
/**
 * Tokenize string s and return a list of tokens (kind, value, line_number)
 *
 * where kind is in ('comment,'id','nl','other','string','ws').
 */
export function python_tokenize(s: string): [string, string, number][] {
    const result: [string, string, number][] = [];

    let i = 0;
    let line_number = 0;

    while (i < s.length) {
        let j = i;
        let progress = i;
        let ch = s[i];
        let kind;
        if (ch === '\n') {
            [kind, i] = ['nl', i + 1];
        } else if (' \t'.includes(ch)) {
            kind = 'ws';
            while (i < s.length && ' \t'.includes(s[i])) {
                i += 1;
            }
        } else if (ch === '#') {
            [kind, i] = ['comment', skip_to_end_of_line(s, i)];
        } else if ('"\''.includes(ch)) {
            [kind, i] = ['string', skip_python_string(s, i)];
        } else if (ch === '_' || isAlpha(ch)) {
            [kind, i] = ['id', skip_id(s, i)];
        } else {
            [kind, i] = ['other', i + 1];
        }
        console.assert(progress < i && j === progress);
        let val = s.slice(j, i);
        console.assert(val);
        line_number += val.split('\n').length - 1; // val.count('\n');  // A comment.
        result.push([kind, val, line_number]);
    }

    return result;
}

//@+node:felix.20211104211229.1: ** g.Scripting
//@+node:felix.20221219205826.1: *3* g.getScript & helpers
/**
 * Return the expansion of the selected text of node p.
 * Return the expansion of all of node p's body text if
 * p is not the current node or if there is no text selection.
 */
export async function getScript(
    c: Commands,
    p: Position,
    useSelectedText: boolean = true,
    forceJavascriptSentinels: boolean = true, // ! LEOJS HAS JAVASCRIPT AS DEFAULT SCRIPT LANGUAGE
    useSentinels: boolean = true
): Promise<string> {
    let script: string = '';
    let s: string;
    const w = c.frame.body.wrapper;

    if (!p || !p.__bool__()) {
        p = c.p;
    }

    try {
        if (app.inBridge) {
            s = p.b;
        } else if (w && p.__eq__(c.p) && useSelectedText && w.hasSelection()) {
            s = w.getSelectedText();
        } else {
            s = p.b;
        }
        // Remove extra leading whitespace so the user may execute indented code.
        s = dedent(s);
        s = extractExecutableString(c, p, s);
        script = await composeScript(
            c,
            p,
            s,
            forceJavascriptSentinels, // ! LEOJS HAS JAVASCRIPT AS DEFAULT SCRIPT LANGUAGE
            useSentinels
        );
    } catch (exception) {
        es_print('unexpected exception in g.getScript');
        es_exception();
        script = '';
    }
    return script;
}
//@+node:felix.20221219205826.2: *4* g.composeScript
/**
 * Compose a script from p.b.
 */
export async function composeScript(
    c: Commands,
    p: Position,
    s: string,
    forceJavascriptSentinels: boolean = true, // ! LEOJS HAS JAVASCRIPT AS DEFAULT SCRIPT LANGUAGE
    useSentinels: boolean = true
): Promise<string> {
    // This causes too many special cases.
    // if not g.unitTesting and forceEncoding:
    // aList = g.get_directives_dict_list(p)
    // encoding = scanAtEncodingDirectives(aList) or 'utf-8'
    // s = g.insertCodingLine(encoding,s)
    if (!s.trim()) {
        return '';
    }
    const at = c.atFileCommands;
    const old_in_script = app.inScript;
    let script;
    try {
        // #1297: set inScript flags.
        inScript = true;
        app.inScript = true;
        app.scriptDict['script1'] = s;
        // Important: converts unicode to utf-8 encoded strings.
        script = await at.stringToString(
            p.copy(),
            s,
            forceJavascriptSentinels, // ! LEOJS HAS JAVASCRIPT AS DEFAULT SCRIPT LANGUAGE
            useSentinels
        );
        // Important, the script is an **encoded string**, not a unicode string.
        script = script.replace(/(?:\r\n)/g, '\n'); // Use brute force.
        app.scriptDict['script2'] = script;
    } finally {
        app.inScript = old_in_script;
        inScript = old_in_script;
    }

    return script;
}

//@+node:felix.20221219205826.3: *4* g.extractExecutableString
/**
 * Return all lines for the given @language directive.
 *
 * Ignore all lines under control of any other @language directive.
 */
export function extractExecutableString(
    c: Commands,
    p: Position,
    s: string
): string {
    // Rewritten to fix //1071.
    if (unitTesting) {
        return s; // Regretable, but necessary.
    }

    // Return s if no @language in effect. Should never happen.
    const language = scanForAtLanguage(c, p);
    if (!language) {
        return s;
    }

    // Return s if @language is unambiguous.
    const pattern = /^@language\s+(\w+)/g;
    const matches = (s || '').match(pattern) || []; // list(re.finditer(pattern, s, re.MULTILINE))
    if (matches.length < 2) {
        return s;
    }

    // Scan the lines, extracting only the valid lines.
    let extracting = false;
    let result = [];
    for (let line of splitLines(s)) {
        const m = pattern.exec(line); // re.match(pattern, line);
        if (m) {
            extracting = m[1] === language;
        } else if (extracting) {
            result.push(line);
        }
    }

    return result.join('');
}

//@+node:felix.20220211012808.1: *3* g.find*Node*
//@+others
//@+node:felix.20220211012829.1: *4* g.findNodeAnywhere
export function findNodeAnywhere(
    c: Commands,
    headline: string,
    exact: boolean = true
): Position | undefined {
    const h = headline.trim();

    for (let p of c.all_unique_positions(false)) {
        if (p.h.trim() === h) {
            return p.copy();
        }
    }

    if (!exact) {
        for (let p of c.all_unique_positions(false)) {
            if (p.h.trim().startsWith(h)) {
                return p.copy();
            }
        }
    }

    return undefined;
}
//@+node:felix.20230427000458.1: *4* g.findNodeInTree
/**
 * Search for a node in v's tree matching the given headline.
 */
export function findNodeInTree(
    c: Commands,
    p: Position,
    headline: string,
    exact = true
): Position | undefined {
    const h = headline.trim();
    const p1 = p.copy();
    for (const p of p1.subtree()) {
        if (p.h.trim() === h) {
            return p.copy();
        }
    }
    if (!exact) {
        for (const p of p1.subtree()) {
            if (p.h.trim().startsWith(h)) {
                return p.copy();
            }
        }
    }

    return undefined;
}
//@-others
//@+node:felix.20211104211349.1: ** g.Unit Tests
//@+node:felix.20211104211355.1: ** g.Urls
//@-others

//@@language typescript
//@@tabwidth -4
//@-leo
