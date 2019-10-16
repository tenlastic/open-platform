using Newtonsoft.Json.Linq;
using System.Linq;
using TMPro;
using UnityEngine;

namespace Tenlastic {
    public class CollectionRoleItemController : MonoBehaviour {

        public CollectionRoleCriteriaItemController criteriaItemTemplate;
        public TMP_InputField keyInput;
        public TMP_Dropdown requiredMatchesDropdown;

        private void Awake() {
            criteriaItemTemplate.gameObject.SetActive(false);
        }

        public void AddCriteria() {
            Transform lastChild = transform.GetChild(transform.childCount - 1);
            GameObject gameObject = Instantiate(
                criteriaItemTemplate.gameObject,
                criteriaItemTemplate.transform.parent
            );

            gameObject.SetActive(true);
            lastChild.SetAsLastSibling();
        }

        public void AddCriteria(JObject jObject) {
            Transform lastChild = transform.GetChild(transform.childCount - 1);
            GameObject gameObject = Instantiate(
                criteriaItemTemplate.gameObject,
                criteriaItemTemplate.transform.parent
            );

            CollectionRoleCriteriaItemController controller = gameObject.GetComponent<CollectionRoleCriteriaItemController>();
            controller.SetCriterion(jObject);

            gameObject.SetActive(true);
            lastChild.SetAsLastSibling();
        }

        public void Set(CollectionModel.RolePermissions role) {
            keyInput.text = role.name;

            JObject query = role.query;
            string[] keys = query.Properties().Select(p => p.Name).ToArray();

            if (keys.Contains("$and")) {
                requiredMatchesDropdown.value = requiredMatchesDropdown.options.FindIndex(o => o.text == "All");
            } else {
                requiredMatchesDropdown.value = requiredMatchesDropdown.options.FindIndex(o => o.text == "At Least One");
            }

            string key = keys[0];
            JToken[] queries = query.GetValue(key).ToArray();

            DestroyCriteria();
            foreach (JToken criterion in queries) {
                AddCriteria(criterion.ToObject<JObject>());
            }
        }

        private void DestroyCriteria() {
            foreach (CollectionRoleCriteriaItemController controller in GetComponentsInChildren<CollectionRoleCriteriaItemController>(true)) {
                if (controller.gameObject == criteriaItemTemplate) {
                    continue;
                }

                Destroy(controller.gameObject);
            }
        }
    }
}
