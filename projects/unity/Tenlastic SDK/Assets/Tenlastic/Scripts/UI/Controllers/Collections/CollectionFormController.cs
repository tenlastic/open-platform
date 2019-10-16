using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;

namespace Tenlastic {
    public class CollectionFormController : FormController<CollectionModel> {

        public CollectionService collectionService;
        public DatabaseModel databaseModel;
        public TMP_InputField nameInput;
        public GameObject propertiesContainer;
        public CollectionPropertyItemController collectionPropertyItemController;
        public CollectionRoleItemController roleTemplate;
        public GameObject rolesContainer;
        public TextMeshProUGUI titleText;

        protected override void OnEnable() {
            base.OnEnable();

            collectionPropertyItemController.gameObject.SetActive(false);
            roleTemplate.gameObject.SetActive(false);
        }

        public void AddProperty() {
            GameObject gameObject = Instantiate(
                collectionPropertyItemController.gameObject,
                collectionPropertyItemController.transform.parent
            );
            gameObject.SetActive(true);
        }

        public void AddProperty(string key, CollectionModel.JsonSchemaProperty jsonSchemaProperty) {
            GameObject gameObject = Instantiate(
                collectionPropertyItemController.gameObject,
                collectionPropertyItemController.transform.parent
            );
            gameObject.SetActive(true);

            CollectionPropertyItemController cpItemController = gameObject.GetComponent<CollectionPropertyItemController>();
            cpItemController.SetJsonSchemaProperty(key, jsonSchemaProperty);
        }

        public void AddRole() {
            GameObject gameObject = Instantiate(
                roleTemplate.gameObject,
                roleTemplate.transform.parent
            );
            gameObject.SetActive(true);
        }

        public void AddRole(CollectionModel.RolePermissions role) {
            GameObject gameObject = Instantiate(
                roleTemplate.gameObject,
                roleTemplate.transform.parent
            );
            gameObject.SetActive(true);

            CollectionRoleItemController controller = gameObject.GetComponent<CollectionRoleItemController>();
            controller.Set(role);
        }

        public void SetDatabaseModel(DatabaseModel databaseModel) {
            this.databaseModel = databaseModel;
        }

        public override void SetRecord(CollectionModel record) {
            this.record = record;

            gameObject.name = titleText.text = "Update Collection";
            nameInput.text = record.name;

            DestroyProperties();
            foreach (string key in record.jsonSchema.properties.Keys) {
                AddProperty(key, record.jsonSchema.properties[key]);
            }

            DestroyRoles();
            foreach (CollectionModel.RolePermissions role in record.permissions.roles) {
                AddRole(role);
            }
        }

        public override void UnsetRecord() {
            record = null;

            gameObject.name = titleText.text = "Create Collection";
            nameInput.text = "";

            DestroyProperties();
            AddProperty();

            DestroyRoles();
            AddRole();
        }

        protected override async Task CreateRecord() {
            JObject jsonSchema = GetJsonSchema();
            JObject permissions = GetPermissions();

            JObject query = new JObject {
                { "databaseId", databaseModel._id },
                { "jsonSchema", jsonSchema },
                { "name", nameInput.text },
                { "permissions", permissions }
            };

            await collectionService.CreateRecord(query);
        }

        protected override async Task UpdateRecord() {
            JObject jsonSchema = GetJsonSchema();
            JObject query = new JObject {
                { "_id", record._id },
                { "databaseId", databaseModel._id },
                { "jsonSchema", jsonSchema },
                { "name", nameInput.text },
            };

            await collectionService.UpdateRecord(query);
        }

        private void DestroyProperties() {
            foreach (Transform child in propertiesContainer.transform) {
                if (child.gameObject == collectionPropertyItemController.gameObject) {
                    continue;
                }

                Destroy(child.gameObject);
            }
        }

        private void DestroyRoles() {
            foreach (Transform child in rolesContainer.transform) {
                if (child.gameObject == roleTemplate.gameObject) {
                    continue;
                }

                Destroy(child.gameObject);
            }
        }

        private JObject GetJsonSchema() {
            CollectionPropertyItemController[] cpItemControllers = propertiesContainer.GetComponentsInChildren<CollectionPropertyItemController>();

            JObject properties = new JObject();
            foreach (CollectionPropertyItemController controller in cpItemControllers) {
                string key = controller.keyInput.text;
                if (string.IsNullOrEmpty(key)) {
                    continue;
                }

                dynamic @default = GetJsonSchemaDefault(controller);
                string format = GetJsonSchemaFormat(controller);
                string type = GetJsonSchemaType(controller);

                JObject jObject = new JObject {
                    { "default", @default },
                    { "format", format },
                    { "type", type.ToLower() }
                };

                properties.Add(key, jObject);
            }

            return new JObject {
                { "properties", properties },
                { "type", "object" }
            };
        }

        private dynamic GetJsonSchemaDefault(CollectionPropertyItemController controller) {
            int typeIndex = controller.typeDropdown.value;
            string type = controller.typeDropdown.options[typeIndex].text;

            switch (type) {
                case "Boolean":
                    TMP_Dropdown dropdown = controller.defaultBooleanDropdown;
                    string booleanString = dropdown.options[dropdown.value].text;
                    return booleanString == "True";

                case "Number":
                    string numberString = controller.defaultNumberDropdown.text;
                    return string.IsNullOrEmpty(numberString) ?
                        0f :
                        float.Parse(numberString, System.Globalization.CultureInfo.InvariantCulture);

                case "String":
                    return string.IsNullOrEmpty(controller.defaultStringDropdown.text) ?
                        "" :
                        controller.defaultStringDropdown.text;
            }

            return null;
        }

        private string GetJsonSchemaFormat(CollectionPropertyItemController controller) {
            int typeIndex = controller.typeDropdown.value;
            string type = controller.typeDropdown.options[typeIndex].text;

            return type == "Timestamp" ? "date-time" : null;
        }

        private string GetJsonSchemaType(CollectionPropertyItemController controller) {
            int typeIndex = controller.typeDropdown.value;
            string type = controller.typeDropdown.options[typeIndex].text;

            return type == "Timestamp" ? "string" : type.ToLower();
        }

        private JObject GetPermissions() {
            JArray roles = GetRoles();

            return new JObject {
                { "roles", roles }
            };
        }

        private JArray GetRoles() {
            JArray roles = new JArray();

            CollectionRoleItemController[] controllers = rolesContainer.GetComponentsInChildren<CollectionRoleItemController>();
            foreach (CollectionRoleItemController controller in controllers) {
                string key = controller.keyInput.text;
                string requiredMatches = controller.requiredMatchesDropdown.options[controller.requiredMatchesDropdown.value].text;
                string andOr = requiredMatches == "All" ? "$and" : "$or";

                JArray criteria = new JArray();

                CollectionRoleCriteriaItemController[] criteriaControllers = controller.GetComponentsInChildren<CollectionRoleCriteriaItemController>();
                foreach (CollectionRoleCriteriaItemController criteriaController in criteriaControllers) {
                    JObject criterion = new JObject();

                    string field = criteriaController.fieldDropdown.options[criteriaController.fieldDropdown.value].text;
                    string operatorDropdownText = criteriaController.operatorDropdown.options[criteriaController.operatorDropdown.value].text;

                    string @operator = "";
                    switch (operatorDropdownText) {
                        case "Equals":
                            @operator = "$eq";
                            break;
                    }

                    string type = criteriaController.typeDropdown.options[criteriaController.typeDropdown.value].text;
                    if (type == "Reference") {
                        string reference = criteriaController.referenceDropdown.options[criteriaController.referenceDropdown.value].text;
                        criterion.Add(field, new JObject {
                            {
                                @operator, new JObject {
                                    { "$ref", reference }
                                }
                            }
                        });
                    } else {
                        if (criteriaController.booleanValueDropdown.gameObject.activeSelf) {
                            List<TMP_Dropdown.OptionData> options = criteriaController.booleanValueDropdown.options;
                            bool value = options[criteriaController.booleanValueDropdown.value].text == "True";

                            criterion.Add(field, new JObject { { @operator, value } });
                        } else if (criteriaController.numberValueInput.gameObject.activeSelf) {
                            float value = float.Parse(criteriaController.numberValueInput.text);
                            criterion.Add(field, new JObject { { @operator, value } });
                        } else {
                            string value = criteriaController.numberValueInput.text;
                            criterion.Add(field, new JObject { { @operator, value } });
                        }
                    }

                    criteria.Add(criterion);
                }

                JObject jObject = new JObject {
                    { "name", key },
                    {
                        "query", new JObject {
                            { andOr, criteria }
                        }
                    }
                };

                roles.Add(jObject);
            }

            return roles;
        }

    }
}
