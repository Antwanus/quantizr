import { Comp } from "./base/Comp";
import { ListBoxRow } from "./ListBoxRow";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { ReactNode } from "react";

let S : Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class ListBox extends Comp {
    selectedRow: ListBoxRow = null;

    constructor(attribs: Object, initialRows: ListBoxRow[] = null) {
        super(attribs);
        this.setClass("list-group");
        this.setChildren(initialRows);

        /* For each of the ListBoxRows we need to tell them all who their parent is */
        initialRows.forEach((row: ListBoxRow) => {
            if (row) {
                if (row.selected) {
                    this.selectedRow = row;
                }
                row.setListBox(this);
            }
        });
    }

    rowClickNotify = (row: ListBoxRow): void => {
        /* Unselect any previously selected row */
        if (this.selectedRow) {
            this.selectedRow.setSelectedState(false);
        }

        /* Select the row that just got clicked */
        this.selectedRow = row;
        this.selectedRow.setSelectedState(true);
    }

    compRender = (): ReactNode => {
        return this.tagRender('div', null, this.attribs);
    }
}
