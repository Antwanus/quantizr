import { Comp } from "./base/Comp";
import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { ReactNode } from "react";

let S : Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class PropTableCell extends Comp {

    constructor(public content: string = "", attribs : Object = {}, initialChildren: Comp[] = null) {
        super(attribs);
        this.setChildren(initialChildren);
    }

    compRender = (): ReactNode => {
        return this.tagRender('td', (this.content || ""), this.attribs);
    }
}
