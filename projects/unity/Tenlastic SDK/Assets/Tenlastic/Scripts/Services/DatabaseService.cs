using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace Tenlastic {
    public class DatabaseService : Service<DatabaseModel> {

        protected override string GetBaseUrl(JObject jObject) {
            return environmentManager.environmentObject.databaseApiBaseUrl;
        }

        protected override Exception GetException(HttpException ex) {
            bool isNameTaken = ex.errors.Any(e => e.name == "UniquenessError" && e.paths.Contains("name"));
            if (isNameTaken) {
                return new ValidationException("name", "Name is already taken.");
            }

            return ex;
        }

        protected override void Validate(JObject jObject) {
            string name = jObject.GetValue("name").ToObject<string>();
            string namespaceId = jObject.GetValue("namespaceId").ToObject<string>();

            if (string.IsNullOrEmpty(name)) {
                throw new ValidationException("name", "Name is required.");
            }

            string regex = @"^[0-9a-z\-]{6,40}$";
            if (!Regex.IsMatch(name, regex)) {
                throw new ValidationException("name", "Name must be alphanumeric with hyphens between 6 and 40 characters.");
            }

            if (string.IsNullOrEmpty(namespaceId)) {
                throw new ValidationException("namespaceId", "Namespace is required.");
            }
        }

    }
}

