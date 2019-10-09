using System.Collections.Generic;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;

namespace Tenlastic {
    public abstract class ListController<TModel> : MonoBehaviour {

        public TextMeshProUGUI errorText;
        public GameObject itemTemplate;

        private List<GameObject> items = new List<GameObject>();

        private void OnEnable() {
            GetRecords();
        }

        public async void GetRecords() {
            foreach (GameObject item in items) {
                Destroy(item);
            }

            TModel[] records = await FindRecords();

            if (records.Length == 0) {
                string error = "No records found.";

                errorText.text = error;
                errorText.gameObject.SetActive(true);

                return;
            }

            foreach (TModel record in records) {
                GameObject item = Instantiate(itemTemplate, itemTemplate.transform.parent);

                SetRecord(item, record);

                item.SetActive(true);
                items.Add(item);
            }

            errorText.gameObject.SetActive(false);
        }

        protected abstract Task<TModel[]> FindRecords();

        protected abstract void SetRecord(GameObject gameObject, TModel record);

    }
}
