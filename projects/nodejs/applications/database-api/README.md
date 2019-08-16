# Database API

## JSON Schema

### Example

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "email": { "type": "string" },
    "name": { "type": "string" }
  }
}
```

### Supported Types

The following types can be used within a Collection's JSON Schema:

- **Boolean**: `{ type: 'boolean' }`
- **Date**: `{ type: 'string', format: 'date-time }`
- **Integer**: `{ type: 'integer' }`
- **Number**: `{ type: 'number' }`
- **String**: `{ type: 'string' }`

### Supported Property Validation

The following formatting validations can be applied to properties within a Collection's
JSON Schema:

- enum
- maximum
- maxLength
- minimum
- minLength
- pattern
- type

## Access Control

Simple access control allows records and their properties to be filtered
by the record's relationship to the current user.

### Example

```json
{
  "create": {
    "roles": {
      "admin": ["customProperties", "customProperties.email", "customProperties.name"]
    }
  },
  "delete": {
    "base": false,
    "roles": {
      "admin": true
    }
  },
  "find": {
    "roles": {
      "default": null
    }
  },
  "read": {
    "base": [
      "_id",
      "collectionId",
      "createdAt",
      "customProperties",
      "customProperties.email",
      "customProperties.name",
      "databaseId",
      "updatedAt"
    ]
  },
  "roles": [{ "name": "admin", "query": { "user.roles": { "$eq": "Admin" } } }],
  "update": { "base": ["customProperties"] }
}
```
