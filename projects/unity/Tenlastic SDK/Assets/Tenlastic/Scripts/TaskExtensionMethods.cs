using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public static class TaskExtensionMethods {

        /// <summary>
        /// Blocks until condition is true or timeout occurs.
        /// </summary>
        /// <param name="condition">The break condition.</param>
        /// <param name="frequency">The frequency in milliseconds at which the condition will be checked.</param>
        /// <param name="timeout">The timeout in milliseconds.</param>
        /// <returns></returns>
        public static async Task WaitUntil(Func<bool> condition, int frequency = 25, int timeout = -1) {
            Task waitTask = Task.Run(async () => {
                while (!condition()) {
                    await Task.Delay(frequency);
                }
            });

            Task result = await Task.WhenAny(waitTask, Task.Delay(timeout));
            if (waitTask != result) {
                throw new TimeoutException();
            }
        }

    }
}
