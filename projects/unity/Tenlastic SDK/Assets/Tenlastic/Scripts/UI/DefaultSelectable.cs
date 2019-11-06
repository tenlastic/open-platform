using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Tenlastic {
    public class DefaultSelectable : MonoBehaviour {

        public Selectable selectable;

        private void OnEnable() {
            StartCoroutine(Select());
        }

        private IEnumerator Select() {
            yield return new WaitForEndOfFrame();
            EventSystem.current.SetSelectedGameObject(selectable.gameObject);
        }

    }
}
