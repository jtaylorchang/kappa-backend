# serverless

## Running Offline

Need to create a `src/secrets.json` file of the following signature. The values do not have to be real for development purposes.

```javascript
{
  "AUTH_SECRET": "<auth_secret>",
  "ADMIN_SECRET": "<admin_secret>",
  "AWS_ACCESS_KEY_ID": "<access_key>",
  "AWS_SECRET_ACCESS_KEY": "<secret_access_key>"
}
```

```bash
yarn offline
```

## Data Sources

| usage                      | url                                                  |
| -------------------------- | ---------------------------------------------------- |
| directory of allowed users | `https://kappathetatau.org/assets/js/directory.json` |

## Sign In / Sign Up

1. client signs in with google
2. client sends google credentials to backend
3. backend verifies email against directory data source
4. backend verifies google token
5. backend creates new user in database if not found
6. returns authorized data

## General Authentication

1. client sends google credentials to backend
2. backend verifies email against database
3. backend verifies google token
4. executes action and returns authorized data
