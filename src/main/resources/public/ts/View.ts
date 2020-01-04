import * as I from "./Interfaces";
import { Singletons } from "./Singletons";
import { PubSub } from "./PubSub";
import { Constants } from "./Constants";
import { ViewIntf } from "./intf/ViewIntf";
import { GraphDisplayDlg } from "./dlg/GraphDisplayDlg";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (s: Singletons) => {
    S = s;
});

//This is magically defined in webpack.common.js;
declare var __BUILDTIME__;

export class View implements ViewIntf {

    docElm: any = (document.documentElement || document.body.parentNode || document.body);
    compareNodeA: I.NodeInfo;

    updateStatusBar = (): void => {
        if (!S.meta64.currentNodeData)
            return;
        var statusLine = "";

        if (S.meta64.editModeOption === S.meta64.MODE_ADVANCED) {
            if (S.meta64.currentNodeData && S.meta64.currentNodeData.node.children) {
                statusLine += "count: " + S.meta64.currentNodeData.node.children.length;
            }
        }

        if (S.meta64.userPreferences.editMode) {
            statusLine += " Selections: " + S.util.getPropertyCount(S.meta64.selectedNodes);
        }
    }

    /*
     * newId is optional parameter which, if supplied, should be the id we scroll to when finally done with the
     * render.
     */
    refreshTreeResponse = async (res?: I.RenderNodeResponse, targetId?: any, scrollToTop?: boolean): Promise<void> => {
        await S.render.renderPageFromData(res, scrollToTop, targetId);
        S.util.delayedFocus("mainNodeContent");
    }

    /*
     * newId is optional and if specified makes the page scroll to and highlight that node upon re-rendering.
     */
    refreshTree = (nodeId?: string, renderParentIfLeaf?: boolean, highlightId?: string, isInitialRender?: boolean, forceIPFSRefresh?: boolean,
        scrollToFirstChild?: boolean): void => {

        if (!nodeId) {
            if (S.meta64.currentNodeData && S.meta64.currentNodeData.node) {
                nodeId = S.meta64.currentNodeData.node.id;
            }
        }

        console.log("Refreshing tree: nodeId=" + nodeId);
        if (!highlightId) {
            let currentSelNode: I.NodeInfo = S.meta64.getHighlightedNode();
            highlightId = currentSelNode != null ? currentSelNode.id : nodeId;
        }

        /*
        I don't know of any reason 'refreshTree' should itself reset the offset, but I leave this comment here
        as a hint for the future.
        nav.mainOffset = 0;
        */
        S.util.ajax<I.RenderNodeRequest, I.RenderNodeResponse>("renderNode", {
            "nodeId": nodeId,
            "upLevel": null,
            "siblingOffset": 0,
            "renderParentIfLeaf": !!renderParentIfLeaf,
            "offset": S.nav.mainOffset,
            "goToLastPage": false,
            "forceIPFSRefresh": forceIPFSRefresh
        }, (res: I.RenderNodeResponse) => {
            if (res.offsetOfNodeFound > -1) {
                S.nav.mainOffset = res.offsetOfNodeFound;
            }
            this.refreshTreeResponse(res, highlightId, false);
        });
    }

    firstPage = (): void => {
        console.log("Running firstPage Query");
        S.nav.mainOffset = 0;
        this.loadPage(false);
    }

    prevPage = (): void => {
        console.log("Running prevPage Query");
        S.nav.mainOffset -= S.nav.ROWS_PER_PAGE;
        if (S.nav.mainOffset < 0) {
            S.nav.mainOffset = 0;
        }
        this.loadPage(false);
    }

    nextPage = (): void => {
        console.log("Running nextPage Query");
        S.nav.mainOffset += S.nav.ROWS_PER_PAGE;
        this.loadPage(false);
    }

    lastPage = (): void => {
        console.log("Running lastPage Query");
        //nav.mainOffset += nav.ROWS_PER_PAGE;
        this.loadPage(true);
    }

    private loadPage = (goToLastPage: boolean): void => {
        S.util.ajax<I.RenderNodeRequest, I.RenderNodeResponse>("renderNode", {
            "nodeId": S.meta64.currentNodeData.node.id,
            "upLevel": null,
            "siblingOffset": 0,
            "renderParentIfLeaf": true,
            "offset": S.nav.mainOffset,
            "goToLastPage": goToLastPage
        }, (res: I.RenderNodeResponse) => {
            if (goToLastPage) {
                if (res.offsetOfNodeFound > -1) {
                    S.nav.mainOffset = res.offsetOfNodeFound;
                }
            }
            this.refreshTreeResponse(res, null, true);
        });
    }

    //todo-1: need to add logic to detect if this is root node on the page, and if so, we consider the first child the target
    scrollRelativeToNode = (dir: string) => {
        let currentSelNode: I.NodeInfo = S.meta64.getHighlightedNode();
        if (!currentSelNode) return;

        //First detect if page root node is selected, before doing a child search
        if (currentSelNode.id == S.meta64.currentNodeData.node.id) {
            //if going down that means first child node.
            if (dir == "down" && S.meta64.currentNodeData.node.children && S.meta64.currentNodeData.node.children.length > 0) {
                S.meta64.highlightNode(S.meta64.currentNodeData.node.children[0], true);
            }
            else if (dir == "up") {
                S.nav.navUpLevel();
            }
            return;
        }

        if (S.meta64.currentNodeData.node.children && S.meta64.currentNodeData.node.children.length > 0) {
            let prevChild = null;
            let nodeFound = false;
            let done = false;
            S.meta64.currentNodeData.node.children.forEach((child: I.NodeInfo) => {
                if (done) return;

                if (nodeFound && dir === "down") {
                    done = true;
                    S.meta64.highlightNode(child, true);
                }

                if (child.id == currentSelNode.id) {
                    if (dir === "up") {
                        if (prevChild) {
                            done = true;
                            S.meta64.highlightNode(prevChild, true);
                        }
                        else {
                            S.meta64.highlightNode(S.meta64.currentNodeData.node, true);
                        }
                    }
                    nodeFound = true;
                }
                prevChild = child;
            });
        }
    }

    scrollToSelectedNode = async (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            S.meta64.setOverlay(true);

            setTimeout(async () => {
                try {
                    /* Check to see if we are rendering the top node (page root), and if so
                    it is better looking to just scroll to zero index, because that will always
                    be what user wants to see */
                    let currentSelNode: I.NodeInfo = S.meta64.getHighlightedNode();
                    if (currentSelNode && S.meta64.currentNodeData.node.id == currentSelNode.id) {
                        this.docElm.scrollTop = 0;
                        return;
                    }

                    let elm: any = S.nav.getSelectedDomElement();
                    if (elm) {
                        elm.scrollIntoView(true);

                        //the 'scrollIntoView' function doesn't work well when we have margin/padding on the document (for our toolbar at the top)
                        //so we have to account for that by scrolling up a bit from where the 'scrollIntoView' will have put is.
                        //Only in the rare case of the very last node on the page will this have slightly undesirable effect of
                        //scrolling up more than we wanted to, but instead of worrying about that I'm keeping this simple.
                        scrollBy(0, -S.meta64.navBarHeight);
                    }
                    else {
                        this.docElm.scrollTop = 0;
                    }

                } finally {
                    setTimeout(() => {
                        S.meta64.setOverlay(false);
                        resolve();
                    }, 100);
                }
            }, 100);
        });
    }

    scrollToTop = async (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                this.docElm.scrollTop = 0;
                resolve();
            }, 250);
        });
    }

    getPathDisplay = (node: I.NodeInfo): string => {
        if (node==null) return "";

        //overflow-x quit working, but also I decided I don't need this path here, so rather than fighting this i'm just removing it for now.
        var path = ""; //"<span style='overflow-x: auto;'>Path: " + node.path + "</span>";

        //if (node.path.indexOf(node.id) != -1) {
            path += "ID: " + node.id;
        //}

        if (node.lastModified) {
            if (path) {
                path += "  ";
            }
            let lastModStr = S.util.formatDate(new Date(node.lastModified));
            path += "(Mod: " + lastModStr + ")";
        }

        //nt:unstructured is included just for legacy support unless/until I put into DB converter.
        if (node.type && node.type != "u" && node.type != "nt:unstructured") {
            if (path) {
                path += "  ";
            }
            path += "Type: " + node.type;
        }
        return path;
    }

    graphDisplayTest = () => {
        //let node = S.meta64.getHighlightedNode();

        let dlg = new GraphDisplayDlg();
        dlg.open();
    }

    runServerCommand = (command: string) => {
        let node = S.meta64.getHighlightedNode();

        S.util.ajax<I.GetServerInfoRequest, I.GetServerInfoResponse>("getServerInfo", {
            "command": command,
            "nodeId": !!node ? node.id : null
        },
            (res: I.GetServerInfoResponse) => {
                res.serverInfo += "<br>Build Time: "+__BUILDTIME__;
                S.util.showMessage(res.serverInfo, true);
            });
    }

    displayNotifications = (command: string) => {
        let node = S.meta64.getHighlightedNode();

        S.util.ajax<I.GetServerInfoRequest, I.GetServerInfoResponse>("getNotifications", {
            "command": command,
            "nodeId": !!node ? node.id : null
        },
            (res: I.GetServerInfoResponse) => {
                if (res.serverInfo) {
                    S.util.showMessage(res.serverInfo, false);
                }
            });
    }

    setCompareNodeA = () => {
        this.compareNodeA = S.meta64.getHighlightedNode();
    }

    compareAsBtoA = () => {
        let nodeB = S.meta64.getHighlightedNode();
        if (nodeB) {
            if (this.compareNodeA.id && nodeB.id) {
                S.util.ajax<I.CompareSubGraphRequest, I.CompareSubGraphResponse>("compareSubGraphs", //
                    { "nodeIdA": this.compareNodeA.id, "nodeIdB": nodeB.id }, //
                    (res: I.CompareSubGraphResponse) => {
                        S.util.showMessage(res.compareInfo);
                    });
            }
        }
    }

    processNodeHashes = (verify: boolean) => {
        let node = S.meta64.getHighlightedNode();
        if (node) {
            let nodeId: string = node.id;
            S.util.ajax<I.GenerateNodeHashRequest, I.GenerateNodeHashResponse>("generateNodeHash", { "nodeId": nodeId, "verify": verify },
                (res: I.GenerateNodeHashResponse) => {
                    S.util.showMessage(res.hashInfo);
                });
        }
    }
}
