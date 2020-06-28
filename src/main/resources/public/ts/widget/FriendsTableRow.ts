import { Singletons } from "../Singletons";
import { PubSub } from "../PubSub";
import { Constants as C } from "../Constants";
import { Heading } from "./Heading";
import { FriendInfo } from "../JavaIntf";
import { ListBoxRow } from "./ListBoxRow";
import { ListBox } from "./ListBox";
import { Div } from "./Div";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class FriendsTableRow extends ListBoxRow {

    constructor(listBox: ListBox, public friend: FriendInfo) {
        super(listBox, null, friend.userName, listBox.isSelectedFunc);
    }

    preRender(): void {
        super.preRender();
        this.setChildren([
            new Div(this.friend.userName, {
                className: "heading5"
            }),
        ]);
    }
}
