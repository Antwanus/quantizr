import { Singletons } from "./Singletons";
import { PubSub } from "./PubSub";
import { Constants as C } from "./Constants";
import { ValueIntf } from "./Interfaces";
import { CompIntf } from "./widget/base/CompIntf";

let S: Singletons;
PubSub.sub(C.PUBSUB_SingletonsReady, (s: Singletons) => {
    S = s;
});

//todo-0: Implement this for every TextField, and then also make it work in Textarea
export class ValueHolder<T> implements ValueIntf {

    constructor(private comp: CompIntf, public propName: string) {
    }

    setValue(val: T): void {
        let obj = {};
        obj[this.propName] = val || "";
        this.comp.mergeState(obj);
    }

    getValue(): T {
        return this.comp.getState()[this.propName];
    }
}