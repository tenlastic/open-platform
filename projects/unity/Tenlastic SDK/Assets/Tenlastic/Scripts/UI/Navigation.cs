using UnityEngine;

namespace Tenlastic {
    public class Navigation : MonoBehaviour {

        public void Select(GameObject gameObject) {
            foreach (Transform trans in transform) {
                trans.gameObject.SetActive(false);
            }

            gameObject.SetActive(true);
        }

    }
}
