
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Tenlastic {
    public class CursorIcon : MonoBehaviour {

        public Texture2D defaultIcon;
        public Texture2D pointerIcon;

        private EventTrigger.Entry entry;
        private Vector3 previousCoordinates = new Vector3();

        private void Update() {
            Vector3 position = Input.mousePosition;
            if (position == previousCoordinates) {
                return;
            }

            PointerEventData pointerData = new PointerEventData(EventSystem.current) {
                pointerId = -1,
                position = position
            };

            List<RaycastResult> results = new List<RaycastResult>();
            EventSystem.current.RaycastAll(pointerData, results);

            foreach (RaycastResult result in results) {
                Selectable selectable = result.gameObject.GetComponent<Selectable>();

                if (selectable != null) {
                    Vector2 pointerHotspot = new Vector2(pointerIcon.width * 0.3f, pointerIcon.height * 0.2f);
                    Cursor.SetCursor(pointerIcon, pointerHotspot, CursorMode.Auto);

                    return;
                }
            }

            Vector2 defaultHotspot = new Vector2(defaultIcon.width * 0.3f, defaultIcon.height * 0.2f);
            Cursor.SetCursor(defaultIcon, defaultHotspot, CursorMode.Auto);

            previousCoordinates = position;
        }

    }
}
