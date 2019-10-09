using System;

namespace Tenlastic {
    public class ValidationException : Exception {

        public string field;

        public ValidationException(string field, string message): base(message) {
            this.field = field;
        }

    }
}
