using System.Collections.Generic;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Tenlastic {
    public abstract class ListController<TModel> : MonoBehaviour {

        public GameObject backgroundImagePrefab;
        public TextMeshProUGUI errorText;
        public GameObject itemTemplate;
        public GameObject loadingContainer;

        private List<GameObject> items = new List<GameObject>();

        private void Awake() {
            errorText.transform.parent.gameObject.SetActive(false);
            itemTemplate.SetActive(false);
            loadingContainer.SetActive(false);

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
                errorText.transform.parent.gameObject.SetActive(true);

                return;
            }

            for (int i = 0; i < records.Length; i++) {
                TModel record = records[i];

                GameObject item = Instantiate(itemTemplate, itemTemplate.transform.parent);
                SetRecord(item, record);

                GameObject backgroundImageGo = Instantiate(backgroundImagePrefab, item.transform);
                backgroundImageGo.transform.SetAsFirstSibling();

                Image backgroundImage = backgroundImageGo.GetComponent<Image>();
                Color color = backgroundImage.color;
                color.a = i % 2 == 0 ? 0.1f : 0f;
                backgroundImage.color = color;

                item.SetActive(true);
                items.Add(item);
            }
        }

        protected abstract Task<TModel[]> FindRecords();

        protected abstract void SetRecord(GameObject gameObject, TModel record);

    }
}
