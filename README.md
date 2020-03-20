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
5. backend generates a JWT
6. backend creates new user in database if not found
7. returns authorized data and the generated token

## General Authentication

1. client sends email as query param and bearer token
2. backend verifies token against email
3. executes action and returns authorized data

## Privileges

- looked up during initial login from directory and saved to database
- auto-route that updates privileges and roles across the board
