using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Tenlastic {
    public class TabNavigation : MonoBehaviour {

        public KeyCode keyCode = KeyCode.Tab;

        private void Update() {
            if (Input.GetKeyDown(keyCode)) {
                if (Input.GetKey(KeyCode.LeftShift)) {
                    Previous();
                } else {
                    Next();
                }
            }
        }

        private void Next() {
            EventSystem eventSystem = EventSystem.current;

            Selectable currentSelectable = eventSystem.currentSelectedGameObject.GetComponent<Selectable>();
            if (currentSelectable == null) {
                return;
            }

            Selectable nextSelectable = currentSelectable.FindSelectableOnRight();
            if (nextSelectable == null) {
                nextSelectable = currentSelectable.FindSelectableOnDown();

                if (nextSelectable == null) {
                    return;
                }
            }

            InputField inputfield = nextSelectable.GetComponent<InputField>();
            if (inputfield != null) {
                inputfield.OnPointerClick(new PointerEventData(eventSystem));
            }

            eventSystem.SetSelectedGameObject(nextSelectable.gameObject, new BaseEventData(eventSystem));
        }

        private void Previous() {
            EventSystem eventSystem = EventSystem.current;

            Selectable currentSelectable = eventSystem.currentSelectedGameObject.GetComponent<Selectable>();
            if (currentSelectable == null) {
                return;
            }

            Selectable previousSelectable = currentSelectable.FindSelectableOnLeft();
            if (previousSelectable == null) {
                previousSelectable = currentSelectable.FindSelectableOnUp();

                if (previousSelectable == null) {
                    return;
                }
            }

            InputField inputfield = previousSelectable.GetComponent<InputField>();
            if (inputfield != null) {
                inputfield.OnPointerClick(new PointerEventData(eventSystem));
            }

            eventSystem.SetSelectedGameObject(previousSelectable.gameObject, new BaseEventData(eventSystem));
        }

    }
}

