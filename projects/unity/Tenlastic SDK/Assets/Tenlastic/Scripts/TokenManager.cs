using UnityEngine;

namespace Tenlastic {
    public class TokenManager : MonoBehaviour {

        public static TokenManager singleton;

        public string accessToken {
            get {
                return PlayerPrefs.HasKey("accessToken") ? PlayerPrefs.GetString("accessToken") : null;
            }
            set {
                if (string.IsNullOrEmpty(value)) {
                    PlayerPrefs.DeleteKey("accessToken");
                } else {
                    PlayerPrefs.SetString("accessToken", value);
                }
            }
        }
        public string refreshToken {
            get {
                return PlayerPrefs.HasKey("refreshToken") ? PlayerPrefs.GetString("refreshToken") : null;
            }
            set {
                if (string.IsNullOrEmpty(value)) {
                    PlayerPrefs.DeleteKey("refreshToken");
                } else {
                    PlayerPrefs.SetString("refreshToken", value);
                }
            }
        }

        private void Awake() {
            if (singleton == null) {
                singleton = this;
                DontDestroyOnLoad(this);
            } else {
                Destroy(this);
            }
        }

        private void OnDestroy() {
            if (singleton = this) {
                singleton = null;
            }
        }

        public void Clear() {
            accessToken = null;
            refreshToken = null;
        }

    }
}
