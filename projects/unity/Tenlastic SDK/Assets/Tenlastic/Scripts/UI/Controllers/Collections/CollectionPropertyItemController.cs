using TMPro;
using UnityEngine;

namespace Tenlastic {
    public class CollectionPropertyItemController : MonoBehaviour {

        public TMP_Dropdown defaultBooleanDropdown;
        public TMP_InputField defaultNumberDropdown;
        public TMP_InputField defaultStringDropdown;
        public TMP_Dropdown defaultTimestampDropdown;
        public TMP_InputField keyInput;
        public TMP_Dropdown typeDropdown;

        private void OnEnable() {
            SetDefault();
        }

        public void SetDefault() {
            HideDefaults();

            switch (typeDropdown.options[typeDropdown.value].text) {
                case "Boolean":
                    defaultBooleanDropdown.transform.parent.gameObject.SetActive(true);
                    break;

                case "Number":
                    defaultNumberDropdown.transform.parent.gameObject.SetActive(true);
                    break;

                case "String":
                    defaultStringDropdown.transform.parent.gameObject.SetActive(true);
                    break;
            }
        }

        public void SetJsonSchemaProperty(string key, CollectionModel.JsonSchemaProperty jsonSchemaProperty) {
            keyInput.text = key;

            string type = jsonSchemaProperty.type;
            if (type == "string" && jsonSchemaProperty.format == "date-time") {
                typeDropdown.value = typeDropdown.options.FindIndex(o => o.text.ToLower() == "timestamp");
            } else {
                typeDropdown.value = typeDropdown.options.FindIndex(o => o.text.ToLower() == type);
            }

            dynamic defaultValue = jsonSchemaProperty.@default;
            if (defaultValue != null) {
                switch (type) {
                    case "boolean":
                        defaultBooleanDropdown.value = defaultBooleanDropdown.options.FindIndex(o => o.text.ToLower() == defaultValue.ToString());
                        break;
                    case "number":
                        defaultNumberDropdown.text = defaultValue.ToString();
                        break;
                    case "string":
                        defaultStringDropdown.text = defaultValue;
                        break;
                }
            }

            SetDefault();
        }

        private void HideDefaults() {
            defaultBooleanDropdown.transform.parent.gameObject.SetActive(false);
            defaultNumberDropdown.transform.parent.gameObject.SetActive(false);
            defaultStringDropdown.transform.parent.gameObject.SetActive(false);
            defaultTimestampDropdown.transform.parent.gameObject.SetActive(false);
        }

    }
}
