import { ReactNode } from "react";
import { CompIntf } from "./base/CompIntf";
import { Div } from "./Div";

export class Menu extends Div {

    static activeMenu: string = "Messaging";

    constructor(public name: string, public menuItems: CompIntf[]) {
        super(null, {
            className: "card menuCard"
        });
    }

    compRender(): ReactNode {
        let state = this.getState();
        this.attribs.style = { display: (state.visible && !state.disabled ? "" : "none") };
        let show = Menu.activeMenu === this.name;

        this.setChildren([
            new Div(this.name, {
                className: "card-header menuHeading mb-0",
                "data-toggle": "collapse",
                // "data-target": "#collapse" + this.getId(),
                href: "#collapse" + this.getId(),
                role: "tab",
                id: "heading" + this.getId(),
                onClick: (elm) => {
                    let expanded = elm.target.getAttribute("aria-expanded") === "true";
                    Menu.activeMenu = expanded ? this.name : null;
                    // console.log("Expand or collapse: "+name+" expan="+elm.target.getAttribute("aria-expanded"));
                }
            }),

            new Div(null, {
                id: "collapse" + this.getId(),
                className: "collapse" + (show ? " show" : ""),
                role: "tabpanel",
                "aria-labelledby": "heading" + this.getId(),
                "data-parent": "#accordion"
            }, [
                new Div(null, {
                    className: "card-body"
                }, [
                    new Div(null, {
                        className: "list-group flex-column"
                    },
                    this.menuItems)
                ])
            ])
        ]);

        return super.compRender();
    }
}
