using Newtonsoft.Json.Linq;
using System.Linq;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;

namespace Tenlastic {
    public class NamespaceFormController : FormController<NamespaceModel> {

        public GameObject accessControlListContainer;
        public AccessControlListItemController accessControlListItemController;
        public TMP_InputField nameInputField;
        public NamespaceService namespaceService;
        public TextMeshProUGUI titleText;
        public UserService userService;

        private void Awake() {
            if (record == null || string.IsNullOrEmpty(record._id)) {
                DestroyAclItems();
                AddAccessControlListEntry();
            } else {
                DestroyAclItems();

                foreach (NamespaceModel.AccessControlListItem aclItem in record.accessControlList) {
                    AddAccessControlListEntry(aclItem);
                }
            }
        }

        protected override void OnEnable() {
            base.OnEnable();

            accessControlListItemController.gameObject.SetActive(false);
        }

        public void AddAccessControlListEntry() {
            GameObject accessControlListItem = Instantiate(
                accessControlListItemController.gameObject,
                accessControlListItemController.transform.parent
            );
            accessControlListItem.SetActive(true);
        }

        public async void AddAccessControlListEntry(NamespaceModel.AccessControlListItem aclItem) {
            UserModel userModel = await userService.FindRecordById(aclItem.userId);
            if (userModel == null) {
                return;
            }

            GameObject gameObject = Instantiate(
                accessControlListItemController.gameObject,
                accessControlListItemController.transform.parent
            );
            gameObject.SetActive(true);

            AccessControlListItemController aclItemController = gameObject.GetComponent<AccessControlListItemController>();
            aclItemController.rolesInput.text = string.Join(",", aclItem.roles);
            aclItemController.usernameInput.text = userModel.username;
        }

        public override void SetRecord(NamespaceModel record) {
            this.record = record;

            gameObject.name = titleText.text = "Update Namespace";
            nameInputField.text = record.name;
        }

        public override void UnsetRecord() {
            record = null;

            gameObject.name = titleText.text = "Create Namespace";
            nameInputField.text = "";
        }

        protected override async Task CreateRecord() {
            AccessControlListItemController[] aclItemControllers = GetComponentsInChildren<AccessControlListItemController>();
            NamespaceService.RolesUsername[] input = aclItemControllers
                .Select(a => {
                    return new NamespaceService.RolesUsername {
                        roles = a.rolesInput.text.Split(','),
                        username = a.usernameInput.text
                    };
                })
                .Where(a => !string.IsNullOrEmpty(a.username))
                .ToArray();

            NamespaceModel.AccessControlListItem[] acl = await namespaceService.GetAcl(input);

            JObject namespaceQuery = new JObject {
                { "accessControlList", new JArray(acl) },
                { "name", nameInputField.text }
            };

            await namespaceService.CreateRecord(namespaceQuery);
        }

        protected override async Task UpdateRecord() {
            AccessControlListItemController[] aclItemControllers = GetComponentsInChildren<AccessControlListItemController>();
            NamespaceService.RolesUsername[] input = aclItemControllers
                .Select(a => {
                    return new NamespaceService.RolesUsername {
                        roles = a.rolesInput.text.Split(','),
                        username = a.usernameInput.text
                    };
                })
                .Where(a => !string.IsNullOrEmpty(a.username))
                .ToArray();

            NamespaceModel.AccessControlListItem[] acl = await namespaceService.GetAcl(input);
            JObject[] jObjects = acl.Select(a => JObject.FromObject(a)).ToArray();

            JObject namespaceQuery = new JObject {
                { "_id", record._id },
                { "accessControlList", new JArray(jObjects) },
                { "name", nameInputField.text }
            };

            await namespaceService.UpdateRecord(namespaceQuery);
        }

        private void DestroyAclItems() {
            foreach (Transform child in accessControlListContainer.transform) {
                if (child.gameObject == accessControlListItemController.gameObject) {
                    continue;
                }

                Destroy(child.gameObject);
            }
        }

    }
}
