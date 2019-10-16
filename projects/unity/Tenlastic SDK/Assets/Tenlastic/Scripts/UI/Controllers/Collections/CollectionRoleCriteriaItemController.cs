using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;

namespace Tenlastic {
    public class CollectionRoleCriteriaItemController : MonoBehaviour {

        public TMP_Dropdown booleanValueDropdown;
        public TMP_Dropdown fieldDropdown;
        public TMP_InputField numberValueInput;
        public TMP_Dropdown operatorDropdown;
        public GameObject propertiesContainer;
        public TMP_Dropdown referenceDropdown;
        public TMP_InputField stringValueInput;
        public TMP_Dropdown typeDropdown;

        public void SetCriterion(JObject criterion) {
            string[] fieldKeys = criterion.Properties().Select(p => p.Name).ToArray();
            string fieldKey = fieldKeys[0];

            UpdateFieldDropdown();
            fieldDropdown.value = fieldDropdown.options.FindIndex(o => o.text == fieldKey);

            JObject query = criterion.GetValue(fieldKey).ToObject<JObject>();
            string[] operatorKeys = query.Properties().Select(p => p.Name).ToArray();
            string operatorKey = operatorKeys[0];

            switch (operatorKey) {
                case "$eq":
                    operatorDropdown.value = operatorDropdown.options.FindIndex(o => o.text == "Equals");
                    break;
            }

            JTokenType valueType = query.GetValue(operatorKey).Type;
            if (valueType == JTokenType.Object) {
                UpdateReferenceDropdown();

                JObject referenceQuery = query.GetValue(operatorKey).ToObject<JObject>();
                string reference = referenceQuery.GetValue("$ref").ToObject<string>();

                referenceDropdown.value = referenceDropdown.options.FindIndex(o => o.text == reference);
                typeDropdown.value = typeDropdown.options.FindIndex(o => o.text == "Reference");
            } else {
                typeDropdown.value = typeDropdown.options.FindIndex(o => o.text == "Value");

                string fieldType = GetFieldType(fieldKey.Replace("properties.", ""));
                switch (fieldType) {
                    case "Boolean":
                        bool booleanValue = query.GetValue(operatorKey).ToObject<bool>();
                        string booleanValueText = booleanValue ? "True" : "False";
                        booleanValueDropdown.value = booleanValueDropdown.options.FindIndex(o => o.text == booleanValueText);
                        break;

                    case "Number":
                        float numberValue = query.GetValue(operatorKey).ToObject<float>();
                        numberValueInput.text = numberValue.ToString();
                        break;

                    case "String":
                        string stringValue = query.GetValue(operatorKey).ToObject<string>();
                        stringValueInput.text = stringValue;
                        break;
                }

                ValueUpdated();
            }
        }

        public void UpdateFieldDropdown() {
            List<string> fields = GetFields();

            int value = fieldDropdown.value;

            fieldDropdown.ClearOptions();
            fieldDropdown.AddOptions(fields);

            fieldDropdown.value = value < fields.Count ? value : 0;
        }

        public void UpdateReferenceDropdown() {
            List<string> fields = GetFields();

            int value = referenceDropdown.value;

            referenceDropdown.ClearOptions();
            referenceDropdown.AddOptions(fields);

            referenceDropdown.value = value < fields.Count ? value : 0;
        }

        public void ValueUpdated() {
            string valueType = typeDropdown.options[typeDropdown.value].text;

            booleanValueDropdown.transform.parent.gameObject.SetActive(false);
            numberValueInput.transform.parent.gameObject.SetActive(false);
            referenceDropdown.transform.parent.gameObject.SetActive(false);
            stringValueInput.transform.parent.gameObject.SetActive(false);

            if (valueType == "Value") {
                string field = fieldDropdown.options[fieldDropdown.value].text.Replace("properties.", "");
                string fieldType = GetFieldType(field);

                switch (fieldType) {
                    case "Boolean":
                        booleanValueDropdown.transform.parent.gameObject.SetActive(true);
                        break;

                    case "Number":
                        numberValueInput.transform.parent.gameObject.SetActive(true);
                        break;

                    case "String":
                        stringValueInput.transform.parent.gameObject.SetActive(true);
                        break;
                }
            } else {
                referenceDropdown.transform.parent.gameObject.SetActive(true);
            }
        }

        private string GetFieldType(string field) {
            CollectionPropertyItemController[] controllers = propertiesContainer.GetComponentsInChildren<CollectionPropertyItemController>();
            CollectionPropertyItemController controller = controllers.First(c => field == c.keyInput.text);

            return controller.typeDropdown.options[controller.typeDropdown.value].text;
        }

        private List<string> GetFields() {
            CollectionPropertyItemController[] controllers = propertiesContainer.GetComponentsInChildren<CollectionPropertyItemController>();
            List<string> recordFields = controllers.Select(c => "properties." + c.keyInput.text).ToList();
            List<string> userFields = new List<string> {
                "user._id",
                "user.email",
                "user.username"
            };

            return recordFields.Concat(userFields).ToList();
        }

    }
}
