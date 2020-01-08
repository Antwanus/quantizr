import { Comp } from "./base/Comp";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { ReactNode } from "react";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class Button extends Comp {

    constructor(text: string, public callback: Function, _attribs: Object = null) {
        super(_attribs);
        S.util.mergeAndMixProps(this.attribs, {
            className: "btn btn-primary basicButton", /* also: secondary, info, success, danger, warning */
            type: "button"
        }, " ");

        this.attribs.onClick = callback;
        this.setText(text);
    }

    setText = (text: string) => {
        this.setState({
            text
        });
    }

    compRender = (): ReactNode => {
        let icon: any;

        if (this.attribs.iconclass) {
            icon = S.e('i', { 
                key: "s_"+this.getId(),
                className: this.attribs.iconclass,
                style: {
                    marginRight: "6px"
                }
            });
        }

        return S.e('button', this.attribs, [icon, this.getState().text]);
    }
}
