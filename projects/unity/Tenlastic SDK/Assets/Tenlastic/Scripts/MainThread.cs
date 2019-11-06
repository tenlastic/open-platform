using System;
using System.Collections.Generic;
using UnityEngine;

namespace Tenlastic {
    public class MainThread : MonoBehaviour {

        public static MainThread singleton;

        private object queueLock = new object();
        private Queue<Action> queue = new Queue<Action>();

        private void Awake() {
            if (singleton == null) {
                singleton = this;
                DontDestroyOnLoad(this);
            } else {
                Destroy(this);
            }
        }

        private void Update() {
            lock (queueLock) {
                while (queue.Count > 0) {
                    queue.Dequeue()?.Invoke();
                }
            }
        }

        public static void Queue(Action action) {
            if (singleton == null) {
                return;
            }

            singleton.queue.Enqueue(action);
        }

    }
}
