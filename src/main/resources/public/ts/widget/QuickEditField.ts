import * as J from "../JavaIntf";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants as C } from "../Constants";
import { Textarea } from "../widget/Textarea";
import { Span } from "./Span";
import { AppState } from "../AppState";
import { Div } from "./Div";
import { ButtonBar } from "./ButtonBar";
import { Button } from "./Button";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class QuickEditField extends Span {

    //These statics help us be able to persist editing (not loose edits) across global renders without storing these
    //in global state which I don't want to do, becuase I don't want these updates triggering rerender cycles.
    static editingId: string = null;
    static editingIsFirst: boolean = false;
    static editingVal: string = null;

    constructor(private node: J.NodeInfo, private isFirst: boolean, private appState: AppState) {
        super();
        this.attribs.className = "quickEditSpan col-11";
        let isEditing = QuickEditField.editingId == node.id && QuickEditField.editingIsFirst == isFirst;

        this.mergeState({
            quickEditVal: isEditing ? QuickEditField.editingVal : "",
            isEditing
        });

        this.startEditing = this.startEditing.bind(this);
        this.saveEdit = this.saveEdit.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
    }

    startEditing(): void {
        if (QuickEditField.editingId) {
            return;
        }
        QuickEditField.editingId = this.node.id;
        QuickEditField.editingVal = "";
        QuickEditField.editingIsFirst = this.isFirst;

        this.mergeState({
            isEditing: true
        });
    }

    preRender(): void {
        let state = this.getState();
        if (!state.isEditing) {
            let clickDiv = new Span("", {
                className: "clickToEdit",
                title: "Click here to insert",
                onClick: this.startEditing
            });
            this.setChildren([clickDiv]);
        }
        else {
            let textarea = new Textarea(null, {
                rows: 5,
            }, null, {
                getValue: () => {
                    return this.getState().quickEditVal;
                },
                setValue: (val: any) => {
                    QuickEditField.editingVal = val;
                    this.mergeState({
                        quickEditVal: val
                    });
                }
            }, "form-control pre-textarea quickEditTextArea");

            let buttonBar = new ButtonBar([
                new Button("Save", this.saveEdit, null, "btn-primary"),
                new Button("Cancel", this.cancelEdit)
            ], null, "marginTop");

            let editContainer = new Div(null, {
                className: "quickEditFormArea"
            }, [textarea, buttonBar]);

            textarea.focus();

            this.setChildren([editContainer]);
        }
    }

    saveEdit(): void {
        //update to not editing state immediately so user gets instant feedback
        this.mergeState({
            isEditing: false
        });

        QuickEditField.editingId = null;
        QuickEditField.editingVal = null;
        let val = this.getState().quickEditVal;

        S.util.ajax<J.InsertNodeRequest, J.InsertNodeResponse>("insertNode", {
            parentId: this.appState.node.id,
            targetOrdinal: this.node.ordinal + (this.isFirst ? 0 : 1),
            newNodeName: "",
            typeName: "u",
            initialValue: val
        }, (res) => {
            //todo-0: this timeout is required, to see the new data, and I don'w know why unless it's mongo not being able to commit fast enough ?
            setTimeout(() => {
                S.view.refreshTree(this.appState.node.id, false, res.newNode.id, false, false, true, false, this.appState);
            }, 250);
        });
    }

    cancelEdit(): void {
        QuickEditField.editingId = null;
        QuickEditField.editingVal = null;
        this.mergeState({
            quickEditVal: "",
            isEditing: false
        });
    }
}