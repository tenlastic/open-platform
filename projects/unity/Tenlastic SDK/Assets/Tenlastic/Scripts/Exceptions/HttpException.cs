using System;
using System.Collections.Generic;
using System.Linq;

namespace Tenlastic {
    public class HttpException : Exception {

        [Serializable]
        public struct HttpError {
            public string kind;
            public string message;
            public string name;
            public string path;
            public List<string> paths;
            public string value;
            public List<string> values;
        }

        [Serializable]
        public struct HttpErrors {
            public List<HttpError> errors;
        }

        public List<HttpError> errors;
        public override string Message {
            get {
                IEnumerable<string> messages = errors.Select(e => string.Format("{0}: {1}", e.name, e.message));
                return string.Format("Status: {0}\nErrors: {1}", status, string.Join("\n", messages));
            }
        }
        public int status;

        public HttpException(int status, string message) {
            HttpError error = new HttpError { message = message };
            errors = new List<HttpError> { error };

            this.status = status;
        }

        public HttpException(int status, List<HttpError> errors) {
            this.errors = errors;
            this.status = status;
        }

    }
}
