# ktt-backend

## Setup

- Run `yarn install`
- Create `secrets.json` file referenced below

## Deploying

- Setup a deploy script `deploy.sh` that exports the appropriate tokens: `SERVERLESS_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`
- Run `yarn deploy`
- Follow serverless directions for deploying

## Running Offline

Need to create a `serverless-config/secrets.json` file of the following signature. The values do not have to be real for development purposes except for ones pertaining to the database connections.

```javascript
{
  "AUTH_SECRET": "<auth_secret>",
  "ADMIN_SECRET": "<admin_secret>",
  "AWS_ACCESS_KEY_ID": "<access_key>",
  "AWS_SECRET_ACCESS_KEY": "<secret_access_key>",
  "MONGODB_URI": "<mongo_database_uri>"
}
```

```bash
yarn offline
```

## Note:

`MySQL` was used in v0.1 but for v1.0 we are moving to store all data in `Mongo`. Originally the `MySQL` hosting was via `Heroku` but we hit free tier limitations and AWS RDS pricing is not perpetual unlike `Mongo`. `Mongo`'s 512mb free tier should be plenty to store all the data for the app. Any references to `SQL` are for legacy purposes but are going to be (or are) deprecated as of v1.0

## Testing

This project uses `serverless` in conjunction with `Mongo`, `MySQL` and `Docker`. In order to test offline, you must have docker installed and our `ktt-docker` repos cloned. You must also have mysql and mongo installed locally, we recommend using Homebrew for MacOS users.

**Installation**

- Clone the `ktt-docker-mysql` and `ktt-docker-mongo` repos, with their default names, as sibling folders of this `ktt-backend` repo.
- Install Docker

**Running**

- Run the Docker Daemon
- Make sure none of our docker instances are running
- Run `yarn run test`

There is a pre-test hook that will spin up a MySQL docker instance and a Mongo docker instance. Both of these will require downloading the first time they are run which may be time intensive. The MySQL docker instance will automatically have the correct SQL dump run during initialization. Both databases will be empty once the hook is complete. The MySQL docker is accessible at `127.0.0.1:3306` and Mongo is at `127.0.0.1:27017` assuming they complete successfully. The tests will be run with `Jest` and then the post-test hook will spin down both docker instances and clear data.

## Data Sources

| usage                      | url                                                  |
| -------------------------- | ---------------------------------------------------- |
| directory of allowed users | `https://kappathetatau.org/assets/js/directory.json` |
| users                      | MongoDB Atlas                                        |
| events                     | AWS RDS MySQL                                        |
| attendance                 | AWS RDS MySQL                                        |
| points                     | AWS RDS MySQL                                        |

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
  firstYear: STRING,    // the first year the user attended UIUC
                        // "2017"
  gradYear: STRING,     // graduation term provided by user
                        // Spring 2021
  phone: STRING         // phone number provided by user
                        // 9784609599
}

EVENT: {
  id: STRING,           // the cryptographically strong unique id for the event created
                        // => 111ce678-6929-480c-964b-7cf355f7d282
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
  start: STRING,        // the ISO datetime of when th eevent begins
                        // => 2020-03-24T01:00:00.000Z
  duration: INT         // the duration of the event in minutes
                        // => 60
}

ATTENDANCE: {
  event_id: STRING,     // the foreign key to an event
                        // => 111ce678-6929-480c-964b-7cf355f7d282
  netid: STRING         // the netid of the user who attended
                        // => jjt4
}

EXCUSE: {
  event_id: STRING,     // the foreign key to an event
                        // => 111ce678-6929-480c-964b-7cf355f7d282
  netid: STRING,        // the netid of the user who requested an excuse
                        // => jjt4
  reason: STRING,       // the reason for the request
                        // => I have a meeting with a professor
  approved: BOOLEAN     // if an exec has approved the requested excuse
                        // => true
}

POINT: {
  event_id: STRING,     // the foreign key to an event
                        // => 111ce678-6929-480c-964b-7cf355f7d282
  category: STRING,     // the category the points are valid for
                        // => Rush
  count: INT            // the number of points the event is worth
                        // => 2
}
```

## Routes

| Route                            | Method | Request                              | Response                                                            | Privilege                      |
| -------------------------------- | ------ | ------------------------------------ | ------------------------------------------------------------------- | ------------------------------ |
| dev/users/login                  | POST   | email, id token                      | their user data and session token or error (bad cred or unapproved) | none                           |
| dev/users/                       | GET    | session token                        | all users' data                                                     | any user                       |
| dev/users/{email}                | PATCH  | session token, target user, changes  | updated user data or error                                          | target user or privileged user |
| dev/events/                      | GET    | session token                        | all events (which data elements depends on privilege) and points    | any user                       |
| dev/events/                      | POST   | session token, event details, points | created event or error                                              | privileged user                |
| dev/events/{event_id}            | PATCH  | session token, target event, changes | updated event data and/or points or error                           | privileged user                |
| dev/events/{event_id}            | DELETE | session token, target event          | deleted event or error                                              | privileged user                |
| dev/attendance                   | POST   | session token, event id, event code  | success or error                                                    | any user                       |
| dev/attendance/users/{email}     | GET    | session token, target user           | all events attended or excused by target user and point aggregates  | target user or privileged user |
| dev/attendance/events/{event_id} | GET    | session token, target event          | attendance and excuses of all users for the target event            | privileged user                |
| dev/excuse                       | GET    | session token                        | all excuses for all events                                          | privileged user                |
| dev/excuse                       | POST   | session token, event id, reason      | success or error                                                    | any user                       |
| dev/excuse                       | PATCH  | session token, event id, approval    | success or error                                                    | privileged user                |
| dev/auto/roles                   | POST   | session token                        | success or error                                                    | privileged user                |

## Optional Chaining

**Note**: this project uses my custom Optional Chaining util, see: https://github.com/jtaylorchang/js-optchain

## DDL

```SQL
CREATE TABLE `event` (
  `id` varchar(36) NOT NULL DEFAULT '',
  `creator` varchar(16) NOT NULL DEFAULT '',
  `event_type` varchar(32) DEFAULT NULL,
  `event_code` varchar(4) DEFAULT NULL,
  `mandatory` tinyint(1) DEFAULT NULL,
  `excusable` tinyint(1) DEFAULT NULL,
  `title` varchar(32) DEFAULT '',
  `description` varchar(256) DEFAULT '',
  `start` varchar(32) DEFAULT '',
  `duration` int(11) DEFAULT NULL,
  `location` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `attendance` (
  `event_id` varchar(36) NOT NULL DEFAULT '',
  `netid` varchar(16) NOT NULL DEFAULT '',
  PRIMARY KEY (`event_id`,`netid`),
  CONSTRAINT `attendance_event_id` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `excuse` (
  `event_id` varchar(36) NOT NULL DEFAULT '',
  `netid` varchar(16) NOT NULL DEFAULT '',
  `reason` varchar(128) NOT NULL DEFAULT '',
  `late` tinyint(1) DEFAULT '0',
  `approved` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`event_id`,`netid`),
  CONSTRAINT `excuse_event_id` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `point` (
  `event_id` varchar(36) NOT NULL DEFAULT '',
  `category` varchar(16) NOT NULL DEFAULT '',
  `count` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`event_id`,`category`),
  CONSTRAINT `point_event_id` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```
