import { TypeHandlerIntf } from "../intf/TypeHandlerIntf";
import { HorizontalLayout } from "./HorizontalLayout";
import { Icon } from "./Icon";
import { ListBoxRow } from "./ListBoxRow";
import { Span } from "./Span";

/* NOTE: This class doesn't hold any state and is re-rendered when the state in the parent owning it is rendered. */
export class NodeTypeListBoxRow extends ListBoxRow {

    constructor(public typeHandler: TypeHandlerIntf, onClickFunc: Function, public isSelected: boolean) {
        super(null, onClickFunc);
    }

    preRender(): void {
        let icon: Icon = null;
        let iconClass = this.typeHandler.getIconClass();
        if (iconClass) {
            icon = new Icon({
                style: { marginRight: "12px", verticalAlign: "middle" },
                className: iconClass
            });
        }

        this.setChildren([
            new HorizontalLayout([
                icon,
                new Span(this.typeHandler.getName())
            ], this.isSelected ? "selectedListItem" : "unselectedListItem")
        ]);
    }
}
