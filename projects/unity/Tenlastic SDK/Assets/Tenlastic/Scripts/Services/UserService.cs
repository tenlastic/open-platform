using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace Tenlastic {
    public class UserService : Service<UserModel> {

        protected override string GetBaseUrl(JObject jObject) {
            return environmentManager.environmentObject.userApiBaseUrl;
        }

        protected override Exception GetException(HttpException ex) {
            bool isEmailTaken = ex.errors.Any(e => e.name == "UniquenessError" && e.paths.Contains("email"));
            if (isEmailTaken) {
                return new ValidationException("email", "Email address is already taken.");
            }

            bool isUsernameTaken = ex.errors.Any(e => e.name == "UniquenessError" && e.paths.Contains("username"));
            if (isUsernameTaken) {
                return new ValidationException("username", "Username is already taken.");
            }

            return ex;
        }

        protected override void Validate(JObject jObject) {
            string email = jObject.GetValue("email").ToObject<string>();
            string username = jObject.GetValue("username").ToObject<string>();

            if (string.IsNullOrEmpty(email)) {
                throw new ValidationException("email", "Email address is required.");
            }

            string regex = @"^[A-Za-z0-9\._%+-]+@[A-Za-z0-9\.-]+\.[A-Za-z]{2,4}$";
            if (!Regex.IsMatch(email, regex)) {
                throw new ValidationException("email", "Email address must be valid.");
            }

            if (string.IsNullOrEmpty(username)) {
                throw new ValidationException("username", "Username is required.");
            }

            string alphanumericPattern = @"^[A-Za-z0-9]+$";
            if (!Regex.IsMatch(username, alphanumericPattern)) {
                throw new ValidationException("username", "Username must be alphanumeric.");
            }

            if (username.Length > 20) {
                throw new ValidationException("username", "Username must be less than 20 characters.");
            }
        }

    }
}

