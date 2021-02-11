import { Position, VNode, StackEntry } from "./leoNodes";
import * as g from './leoGlobals';
import { LeoUI } from '../leoUI';

/**
 * A per-outline class. Called 'class Commands' in Leo's python source
 * The "c" predefined object is an instance of this class.
 */
export class Commander {

    // Official ivars.
    private _topPosition : Position | undefined;
    private _currentPosition: Position | undefined;
    
    public hiddenRootNode: VNode | undefined;
    
    public mFileName: string;
    public mRelativeFileName = null;
    public gui:LeoUI;
    public frame: any; // TODO : FAKE FRAME
    
    // File Ivars
    public changed: boolean = false;

    // _currentCount = 0

    constructor(
        fileName: string,
        gui?:LeoUI,
        previousSettings?:any,
        relativeFileName?:any
    ) {
        this.mFileName = fileName;
        this.gui = gui || g.app.gui;
    }

    public recolor():void {
        console.log("recolor");
    }

    public redraw():void {
        console.log("redraw");
    }

    public redraw_after_icons_changed():void {
        console.log("redraw_after_icons_changed");
    }

    /**
     * A generator returning all vnodes in the outline, in outline order.
     */
    public *all_nodes(): Generator<VNode> {
        const c:Commander = this;
        for(let p of c.all_positions()){
            yield p.v;
        }
    }


    /**
     * A generator returning each vnode of the outline.
     */
    public *all_unique_nodes(): Generator<VNode> {
        const c:Commander = this;
        for(let p of c.all_unique_positions(false)){
            yield p.v;
        }
    }

    /**
     * A generator return all positions of the outline, in outline order.
     */
    public *all_positions(copy?=true):Generator<Position> {
        const c:Commander = this;
        const p:Position = c.rootPosition();
        while( p.__bool__()){
            yield (copy ? p.copy() : p);
            p.moveToThreadNext();
        }
    }

    /**
     * Generates all positions p in this outline where p.v is v.
     *  
     *  Should be called with stack=None.
     *  
     *  The generated positions are not necessarily in outline order.
     *  
     *  By Виталије Милошевић (Vitalije Milosevic).
     */
    public *all_positions_for_v(v:VNode, stack?:StackEntry[]):Generator<Position> {

        const c:Commander = this;

        if (!stack){
            stack = [];
        }
        
        if (!(v instanceof VNode)) {
            g.es_print(`not a VNode: ${JSON.stringify(v)}`);
            return;  // Stop the generator.
        }

        /** 
         * Yield all indices i such that v.children[i] == target_v.
         */
        function *allinds(v:VNode, target_v:VNode): Generator<number>{
            const arrayLength=v.children.length;
            for (var i = 0; i < arrayLength; i++) {
                if(v.children[i].gnx === target_v.gnx){
                    yield i;
                }
            }
        }

        /** 
         * Convert the stack to a position.
         */
        function stack2pos(stack:StackEntry[]): Position{
            let v:VNode;
            let i:number;
            [v, i] = stack[stack.length - 1];
            return new Position(v, i, stack.slice(0,-1));
        }

        for(let v2 of v.parents){
            for(let i of allinds(v2, v)){
                stack.unshift([v, i]);
                if(v2.gnx === c.hiddenRootNode!.gnx){
                    yield stack2pos(stack);
                }else{
                    yield* c.all_positions_for_v(v2, stack);
                }
                stack.shift();
            }
        }
    }

    /**
     * A generator yielding *all* the root positions in the outline that
     * satisfy the given predicate. p.isAnyAtFileNode is the default
     * predicate.
     *
     * The generator yields all **root** anywhere in the outline that satisfy
     * the predicate. Once a root is found, the generator skips its subtree.
     */
    public *all_roots(copy?=true, predicate?: (p:Position) => boolean):Generator<Position> {
        const c:Commander = this;
        
        if(!predicate){
            // pylint: disable=function-redefined
            predicate = function(p:Position):boolean {
                return p.isAnyAtFileNode();
            };
        }

        const p:Position = c.rootPosition();
        while(p.__bool__()){
            if (predicate(p)){
                yield p.copy();  // 2017/02/19
                p.moveToNodeAfterTree();
            }else{
                p.moveToThreadNext();
            }
        }
    }

    /**
     * A generator return all positions of the outline, in outline order.
     * Returns only the first position for each vnode.
     */
    public *all_unique_positions(copy?=true):Generator<Position> {
        const c:Commander = this;
        const p:Position = c.rootPosition();
        const seen:VNode[] = [];
        while (p.__bool__()){
            if(seen.includes(p.v)){
                p.moveToNodeAfterTree();
            }else{
                seen.push(p.v);
                yield (copy ? p.copy() : p);
                p.moveToThreadNext();
            }
        }
    }

    /**
     * A generator yielding all unique root positions in the outline that
     * satisfy the given predicate. p.isAnyAtFileNode is the default
     * predicate.
     *
     * The generator yields all **root** anywhere in the outline that satisfy
     * the predicate. Once a root is found, the generator skips its subtree.
     */
    public *all_unique_roots(copy?=true, predicate?: (p:Position) => boolean):Generator<Position> {
        const c:Commander = this;
        
        if(!predicate){
            // pylint: disable=function-redefined
            predicate = function(p:Position):boolean {
                return p.isAnyAtFileNode();
            };
        }

        const seen:VNode[] = [];
        const p:Position = c.rootPosition();
        while (p.__bool__()){
            if(!seen.includes(p.v) && predicate(p)){
                seen.push(p.v);
                yield (copy ? p.copy() : p);
                p.moveToNodeAfterTree();
            }else{
                p.moveToThreadNext();
            }
        }
    }
    /**
     * A generator returning all positions of the outline. This generator does
     * *not* assume that vnodes are never their own ancestors.
     */
    public *safe_all_positions(copy?=true): Generator<Position> {
        const c:Commander = this;
        const p:Position = c.rootPosition(); // Make one copy.
        while (p.__bool__()){
            yield (copy ? p.copy() : p);
            p.safeMoveToThreadNext();
        }
    }

    /**
     * Return a copy of the presently selected position or a new null
     * position. So c.p.copy() is never necessary.
     */
    public currentPosition(): Position|undefined {
        const c:Commander = this;
        if (c._currentPosition){
            // *Always* return a copy.
            return c._currentPosition.copy();
        }
        return c.rootPosition();
    }

    // For compatibiility with old scripts...
    // currentVnode = currentPosition

    // Compatibility with scripts

    public fileName():string {
        let s:string = this.mFileName || "";
        if (g.isWindows){
            s = s.replace('\\', '/');
        }
        return s;
    }

    public relativeFileName():string {
        return this.mRelativeFileName || this.mFileName;
    }

    public shortFileName():string {
        return g.shortFileName(this.mFileName);
    }

    // * Alternative Naming
    // shortFilename = shortFileName

    /**
     * Move to the first visible node of the present chapter or hoist.
     */
    public firstVisible():Position {
        const c:Commander = this;
        let p:Position = c.p;
        while( 1){
            let back:Position = p.visBack(c);
            if( back.__bool__() && back.isVisible(c)){
                p = back;
            }else{
                break;
            }
        }
        return p;
    }

    /**
     * Return the tab width in effect at p.
     */
    public getTabWidth(p:Position):number {
        const c:Commander = this;
        const val:number = g.scanAllAtTabWidthDirectives(c, p);
        return val;
    }

    /**
     * Return True if the current position is the root position.
     *
     * This method is called during idle time, so not generating positions
     * here fixes a major leak.
     */
    public currentPositionIsRootPosition():boolean {
        const c:Commander = this;
        const root:Position = c.rootPosition();
        return !!c._currentPosition &&
               !!root &&
               c._currentPosition.__bool__() &&
               root.__bool__() && c._currentPosition.__eq__(root);
    }

        // return (
            // c._currentPosition and c._rootPosition and
            // c._currentPosition == c._rootPosition)

    /**
     * Return True if the current position is the root position.

        This method is called during idle time, so not generating positions
        here fixes a major leak.
     */
    public currentPositionHasNext():boolean {
        const c:Commander = this;
        const current:Position = c._currentPosition!;
        return current && current.__bool__() && current.hasNext()!;
        return false;
    }

    public isCurrentPosition(p:Position):boolean {
        const c:Commander = this;
        if(!p || !c._currentPosition ||
            !p.__bool__() || !!c._currentPosition.__bool__()){
            return false;
        }
        return p.__eq__(c._currentPosition);
    }

    public isRootPosition(p):boolean {
        const c:Commander = this;
        const root:Position = c.rootPosition();
        return !!p &&
               !!root &&
               p.__bool__() &&
               root.__bool__() && p.__eq__(root);
    }

    public isChanged():boolean {
        return this.changed;
    }

    /**
     * Return the last top-level position in the outline.
     */
    public lastTopLevel():Position {
        const c:Commander = this;
        const p:Position = c.rootPosition();
        while(p.hasNext()){
            p.moveToNext();
        }
        return p;
    }

    /**
     * New in Leo 5.5: Return None.
     * Using empty positions masks problems in program logic.
     * In fact, there are no longer any calls to this method in Leo's core.
     */
    public nullPosition():void {
        g.trace('This method is deprecated. Instead, just use None.');
        // pylint complains if we return None.
    }

    /**
     * Return True if a position exists in c's tree
     */
    public positionExists(p:Position, root?:Position, trace?:boolean):boolean {

        if(!p || !p.__bool__() || !p.v){
            return false;
        }

        const rstack:StackEntry[] = (root && root.__bool__())?root.stack.concat([root.v, root._childIndex]):[];
        const pstack:StackEntry[] = p.stack.concat([p.v, p._childIndex]);

        if(rstack.length > pstack.length){
            return false;
        }

        let par:VNode = this.hiddenRootNode!;
        
        let arrayLength:number = pstack.length;

        for(let j=0; j<arrayLength; j++){
            const x:StackEntry = pstack[j];
        
            if (j < rstack.length && (x[0].gnx !== rstack[j][0].gnx || x[1] !== rstack[j][1])){
                return false;
            }
            
            let v:VNode;
            let i:number;
            [v, i] = x;
            
            if( i >= par.children.length || v.gnx !== par.children[i].gnx ){
                return false;
            }
                
            par = v;
        }
        return true;
    }

    /**
     * Dump position p and it's ancestors.
     */
    public dumpPosition(p:Position):void {
        g.trace('=====', p.h, p._childIndex);
        
        let arrayLength:number = p.stack.length;
        for(let i=0; i<arrayLength; i++){
            const data = p.stack[i];
            let v:VNode;
            let childIndex:number;
            [v, childIndex] = data;
            console.log(`${i} ${childIndex} ${v._headString}`);
        }
    }

    /**
     * Return the root position.
     *
     * Root position is the first position in the document. Other
     * top level positions are siblings of this node.
     */
    public rootPosition():Position|undefined {
        const c:Commander = this;
        // 2011/02/25: Compute the position directly.
        if(!!c.hiddenRootNode && c.hiddenRootNode.children.length){
            const v:VNode = c.hiddenRootNode.children[0];
            return new Position(v, 0, undefined);
        }
        return undefined;
    }

    // * For compatibility with old scripts...
    // rootVnode = rootPosition
    // findRootPosition = rootPosition

    /**
     * Return True if the node at position p should be expanded.
     */
    public shouldBeExpanded(p:Position):boolean {
        const c:Commander = this;
        const v:VNode = p.v;
        if (!p.hasChildren()){
            return false;
        }
        // Always clear non-existent positions.
        // v.expandedPositions: Position[] = [z for z in v.expandedPositions if c.positionExists(z)]
        v.expandedPositions = v.expandedPositions.filter(z=>c.positionExists(z));
        
        if (!p.isCloned()){
            // Do not call p.isExpanded here! It calls this method.
            return p.v.isExpanded();
        }
        if(p.isAncestorOf(c.p)){
            return true;
        }
        for(let p2 of v.expandedPositions){
            if(p.__eq__(p2)){
                return true;
            }
        }
        return false;
    }

    /**
     * Return the topmost visible node.
     * This is affected by chapters and hoists.
     */
    public visLimit(): [Position, boolean]|undefined {
        const c:Commander = this;
        const cc:any = false;// c.chapterController
        if c.hoistStack:
            bunch = c.hoistStack[-1];
            p = bunch.p;
            limitIsVisible = !cc || !p.h.startswith('@chapter');
            return [p, limitIsVisible];
        return undefined;
    }

    /**
     * commander current position property
     */
    public get p():Position {
        const c:Commander = this;
        return c.currentPosition();
    }

    public appendStringToBody(p:Position, s:string): void {
        if (s){
            p.b = p.b + g.toUnicode(s);
        }
    }

    public clearAllMarked(): void {
        const c:Commander = this;
        for p in c.all_unique_positions(copy=False):
            p.v.clearMarked()
    }

    public clearAllVisited(): void {
        const c:Commander = this;
        for p in c.all_unique_positions(copy=False):
            p.v.clearVisited()
            p.v.clearWriteBit()
    }

    /**
     * clear the marker that indicates that the .leo file has been changed.
     */
    public clearChanged(): void {
        const c:Commander = this;
        c.changed = False
        // Clear all dirty bits _before_ setting the caption.
        for v in c.all_unique_nodes():
            v.clearDirty()
        c.changed = False
        // * Old code.
            // master = getattr(c.frame.top, 'leo_master', None)
            // if master:
                // master.setChanged(c, False)
                    // // LeoTabbedTopLevel.setChanged.
            // s = c.frame.getTitle()
            // if len(s) > 2 and s[0:2] == "* ":
                // c.frame.setTitle(s[2:])
    }

    public clearMarked(p):void {
        const c:Commander = this;
        p.v.clearMarked();
        g.doHook("clear-mark", c, p);
    }

    /**
     * This is equivalent to p.b = s.
     * Warning: This method may call c.recolor() or c.redraw().
     */
    public setBodyString(p:Position, s:string): void {
        c, v = self, p.v
        if not c or not v:
            return
        s = g.toUnicode(s)
        current = c.p
        // 1/22/05: Major change: the previous test was: 'if p == current:'
        // This worked because commands work on the presently selected node.
        // But setRecentFiles may change a _clone_ of the selected node!
        if current and p.v == current.v:
            w = c.frame.body.wrapper
            w.setAllText(s)
            v.setSelection(0,0)
            c.recolor()
        // Keep the body text in the VNode up-to-date.
        if v.b != s:
            v.setBodyString(s)
            v.setSelection(0, 0)
            p.setDirty()
            if not c.isChanged():
                c.setChanged()
            c.redraw_after_icons_changed()
    }

    /**
     * Set the marker that indicates that the .leo file has been changed.
     */
    public setChanged(redrawFlag?:boolean=true): void {
        const c:Commander = this;
        c.changed = true;
        // Do nothing for null frames.
        //if !redrawFlag:  // Prevent flash when fixing #387.
        //    return
        // * Old code.
            // master = getattr(c.frame.top, 'leo_master', None)
            // if master:
                // master.setChanged(c, True)
                    // // LeoTabbedTopLevel.setChanged.
            // s = c.frame.getTitle()
            // if len(s) > 2 and s[0] != '*':
                // c.frame.setTitle("* " + s)
    }

    /**
     * Set the presently selected position. For internal use only.
     * Client code should use c.selectPosition instead.
     */
    public setCurrentPosition(p):void {
        const c:Commander = this;
        if not p:
            g.trace('===== no p', g.callers())
            return
        if c.positionExists(p):
            if c._currentPosition and p == c._currentPosition:
                pass  // We have already made a copy.
            else:  // Make a copy _now_
                c._currentPosition = p.copy()
        else:  // 2011/02/25:
            c._currentPosition = c.rootPosition()
            g.trace(f"Invalid position: {repr(p and p.h)}")
            g.trace(g.callers())
            // Don't kill unit tests for this kind of problem.
    }

    // * For compatibiility with old scripts.
    //setCurrentVnode = setCurrentPosition


}


