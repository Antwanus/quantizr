import { DialogBase } from "../DialogBase";
import * as I from "../Interfaces";
import { ButtonBar } from "../widget/ButtonBar";
import { Button } from "../widget/Button";
import { RadioButton } from "../widget/RadioButton";
import { Checkbox } from "../widget/Checkbox";
import { Div } from "../widget/Div";
import { PubSub } from "../PubSub";
import { Constants } from "../Constants";
import { Singletons } from "../Singletons";
import { Form } from "../widget/Form";
import { FormGroup } from "../widget/FormGroup";

let S: Singletons;
PubSub.sub(Constants.PUBSUB_SingletonsReady, (ctx: Singletons) => {
    S = ctx;
});

export class PrefsDlg extends DialogBase {

    simpleRadioButton: RadioButton;
    advancedRadioButton: RadioButton;
    showMetadataCheckBox: Checkbox;

    constructor() {
        super("Preferences");
    }

    init = (): void => {
        this.setChildren([
            new Form(null, [
                new FormGroup(null,
                    [
                        this.simpleRadioButton = new RadioButton("Simple", S.meta64.editModeOption == S.meta64.MODE_SIMPLE, "exportRadioGroup"),
                        this.advancedRadioButton = new RadioButton("Advanced", S.meta64.editModeOption == S.meta64.MODE_ADVANCED, "exportRadioGroup"),
                    ]
                ),
                new FormGroup(null,
                    [
                        this.showMetadataCheckBox = new Checkbox("Show Metadata", S.meta64.showMetaData),
                    ]
                ),
                new ButtonBar(
                    [
                        new Button("Save", this.savePreferences, null, "primary"),
                        new Button("Cancel", () => {
                            this.close();
                        })
                    ])

            ])
        ]);
    }

    savePreferences = (): void => {
        S.meta64.editModeOption = this.simpleRadioButton.getChecked() ? S.meta64.MODE_SIMPLE
            : S.meta64.MODE_ADVANCED;
        S.meta64.showMetaData = this.showMetadataCheckBox.getChecked();

        S.util.ajax<I.SaveUserPreferencesRequest, I.SaveUserPreferencesResponse>("saveUserPreferences", {
            //todo-2: both of these options should come from meta64.userPrefernces, and not be stored directly on meta64 scope.
            "userPreferences": {
                "advancedMode": S.meta64.editModeOption === S.meta64.MODE_ADVANCED,
                "editMode": S.meta64.userPreferences.editMode,
                "importAllowed": false,
                "exportAllowed": false,
                "showMetaData": S.meta64.showMetaData
            }
        }, this.savePreferencesResponse);
        this.close();
    }

    savePreferencesResponse = (res: I.SaveUserPreferencesResponse): void => {
        if (S.util.checkSuccess("Saving Preferences", res)) {
            S.meta64.selectTab("mainTab");
            S.meta64.refresh();
        }
    }
}
