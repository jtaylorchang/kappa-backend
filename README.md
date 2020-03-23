# serverless

## Running Offline

Need to create a `serverless-config/secrets.json` file of the following signature. The values do not have to be real for development purposes.

```javascript
{
  "AUTH_SECRET": "<auth_secret>",
  "ADMIN_SECRET": "<admin_secret>",
  "AWS_ACCESS_KEY_ID": "<access_key>",
  "AWS_SECRET_ACCESS_KEY": "<secret_access_key>",
  "MONGODB_URI": "<mongo_database_uri>",
  "SQL_HOST": "<sql_host>",
  "SQL_DATABASE": "<sql_database>",
  "SQL_USERNAME": "<sql_username>",
  "SQL_PASSWORD": "<sql_password>"
}
```

```bash
yarn offline
```

## Data Sources

| usage                      | url                                                  |
| -------------------------- | ---------------------------------------------------- |
| directory of allowed users | `https://kappathetatau.org/assets/js/directory.json` |
| users                      | MongoDB                                              |
| events                     | Heroku SQL                                           |
| attendance                 | Heroku SQL                                           |

## Functions

### Sign In / Sign Up [working]

Account sign in and sign up are handled by the `login` route. A user provides their credentials which are verified against Google OAuth2 as well as our official records (`directory` data source). This information is then combined. Assuming the user passes both checks, the user is added to the database if not already present. A session token is generated by signing their email and the `AUTH_SECRET` and is returned to the user. The user then only needs their session token to authenticate and does not need to validate against Google or our records.

1. client signs in with google
2. client sends google credentials to backend
3. backend verifies email against directory data source
4. backend verifies google token
5. backend generates a JWT
6. backend creates new user in database if not found
7. returns authorized data and the generated token

### General Authentication [working]

Header authorization is handled by middleware. Step 3 is handled by each route that requires authorization. After authorization occurs, the data will be automatically attached to the route's `event` object and is accessible. See `users/update-one.js` for an example. The middleware will automatically assume authorization is required **unless specified otherwise** in the route's `middyfy` call.

1. client sends bearer token
2. backend verifies token against email
3. executes action and returns authorized data

### Privileges

Privileges are stored in official records in the `directory` data source. These are transitioned into the user database upon account creation. Exec transitions happen once yearly. To propogate changes to the `directory`, the `auto/update-roles.js` route will verify each user in the database against the `directory` and strip/add privileges and rolls where necessary.

- looked up during initial login from directory and saved to database
- auto-route that updates privileges and roles across the board

## Data Schemas

```javascript
USER: {
  _id: ID,              // generated by MongoDB upon creation
                        // 5e77a2d370da5ae6e12bf99c
  email: STRING,        // <netid>@illinois.edu provided by Google OAuth
                        // jjt4@illinois.edu
  familyName: STRING,   // last name provided by Google OAuth
                        // Taylor-Chang
  givenName: STRING,    // given name provided by Google OAuth
                        // Jeffrey
  semester: STRING,     // pledge semester from official directory
                        // Fall 2018
  type: STRING,         // member type from official directory (currently only "B")
                        // B
  role?: STRING,        // executive role from official directory
                        // Web Chair
  privileged?: BOOLEAN, // is a power-user (all executives are by default) from official directory
                        // true
  gradYear: STRING,     // graduation term provided by user
                        // Spring 2021
  phone: STRING         // phone number provided by user
                        // 9784609599
}

EVENT: {
  id: INT,              // the unique auto-incremented id for the event upon creation
                        // => 2
  creator: STRING,      // the netid of the power-user responsible for creating the event
                        // => jjt4
  event_type: STRING,   // the category type of the event
                        // => GM
  event_code: STRING,   // a cryptographically-strong uniquely generated code (or manually supplied)
                        // => 647319
  mandatory: BOOLEAN,   // if the event unexcused would result in probation
                        // => false
  excusable: BOOLEAN,   // if the event can be excused
                        // => true
  title: STRING,        // the short title of the event
                        // => General Meeting
  description: STRING,  // the description of the event
                        // => Weekly chapter meeting for exec to provide updates to the chapter
  start: DATETIME,      // the UTC datetime of when th eevent begins
                        // => 2020-03-24T01:00:00.000Z
  duration: INT         // the duration of the event in minutes
                        // => 60
}

ATTENDANCE: {
  event_id: INT,        // the foreign key to an event
                        // => 2
  netid: STRING         // the netid of the user who attended
                        // => jjt4
}

EXCUSE: {
  event_id: INT,        // the foreign key to an event
                        // => 2
  netid: STRING,        // the netid of the user who requested an excuse
                        // => jjt4
  reason: STRING,       // the reason for the request
                        // => I have a meeting with a professor
  approved: BOOLEAN     // if an exec has approved the requested excuse
                        // => true
}

POINT: {
  event_id: INT,        // the foreign key to an event
                        // => 7
  category: STRING,     // the category the points are valid for
                        // => Rush
  count: INT            // the number of points the event is worth
                        // => 2
}
```

## Routes

| Route                           | Method | Request                              | Response                                                            | Privilege                      |
| ------------------------------- | ------ | ------------------------------------ | ------------------------------------------------------------------- | ------------------------------ |
| dev/users/login                 | POST   | email, id token                      | their user data and session token or error (bad cred or unapproved) | none                           |
| dev/users/                      | GET    | session token                        | all users' data                                                     | any user                       |
| dev/users/{email}               | PATCH  | session token, target user, changes  | updated user data or error                                          | target user or privileged user |
| dev/events/                     | GET    | session token                        | all events (which data elements depends on privilege)               | any user                       |
| dev/events/                     | POST   | session token, event details         | created event or error                                              | privileged user                |
| dev/events/{eventId}            | PATCH  | session token, target event, changes | updated event data or error                                         | privileged user                |
| dev/attendance                  | POST   | session token, event id, event code  | success or error                                                    | any user                       |
| dev/attendance/users/{email}    | GET    | session token, target user           | all events attended or excused by target user                       | target user or privileged user |
| dev/attendance/events/{eventId} | GET    | session token, target event          | attendance and excuses of all users for the target event            | privileged user                |
| dev/excuse                      | GET    | session token                        | all excuses for all events                                          | privileged user                |
| dev/excuse                      | POST   | session token, event id, reason      | success or error                                                    | any user                       |
| dev/excuse                      | PATCH  | session token, event id, approval    | success or error                                                    | privileged user                |
| dev/auto/roles                  | POST   | session token                        | success or error                                                    | privileged user                |

## Optional Chaining

**Note**: this project uses a custom Optional Chaining util that was inspired by ts-optchain. I wanted to include the ts-optchain package but JS can't infer types.

The first argument is as far into the chain as you can get with confidence that your final child is the only one that may be optional.

The second argument is the schema of its optional chain with default values.

The returned result is an object that will match the schema and have default values if none could be populated.

Therefore, all of these inputs are valid:

```javascript
const handler1 = {
  event: {}
};

const handler2 = {
  event: {
    body: {}
  }
};

const handler3 = {
  event: {
    body: {
      username: 'jeff'
    }
  }
};

const handler4 = {
  event: {
    body: {
      username: 'jeff',
      password: 'password'
    }
  }
};

const ocBody1 = oc(handler1.event.body, {
  username: 'defaultUsername',
  password: 'defaultPassword'
});
const ocBody2 = oc(handler2.event.body, {
  username: 'defaultUsername',
  password: 'defaultPassword'
});
const ocBody3 = oc(handler3.event.body, {
  username: 'defaultUsername',
  password: 'defaultPassword'
});
const ocBody4 = oc(handler4.event.body, {
  username: 'defaultUsername',
  password: 'defaultPassword'
});

console.log(ocBody1.username === 'defaultUsername' && ocBody1.password === 'defaultPassword');
console.log(ocBody2.username === 'defaultUsername' && ocBody2.password === 'defaultPassword');
console.log(ocBody3.username === 'jeff' && ocBody3.password === 'defaultPassword');
console.log(ocBody4.username === 'jeff' && ocBody4.password === 'password');
```
