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

## Routes

| Route                           | Method | Request                                                                                         | Response                                                                             | Privilege                     | Purpose |
| ------------------------------- | ------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------- | ------- |
| dev/users/register              | POST   | username, password, firstname, lastname, personal email, phone, pledge semester, class standing | success or error                                                                     | any                           | -       |
| dev/users/login                 | POST   | username, password or JWT                                                                       | JWT or error (bad cred or unapproved)                                                | approved user                 | -       |
| dev/users/                      | GET    | username, JWT                                                                                   | all users                                                                            | approved user                 | -       |
| dev/users/{username}            | UPDATE | username, JWT, target user, data                                                                | updated user data or error                                                           | target user or high privilege | -       |
| dev/events/                     | POST   | username, JWT, event details, optional event code                                               | created event or error                                                               | high privilege user           | -       |
| dev/attendance                  | POST   | username, JWT, event id, event code or excuse                                                   | success or error                                                                     | approved user                 | -       |
| dev/events/                     | GET    | username, JWT, event type, all dates or just current/future ones                                | all events and users who attended them if high privilege user                        | approved user                 | -       |
| dev/attendance/users/{username} | GET    | username, JWT, target user, event type                                                          | all events marked if attended or excuse by target user                               | target user or high privilege | -       |
| dev/attendance/events/{eventId} | GET    | username, JWT, event type                                                                       | attendance of each user including excuse count and required events if high privilege | high privilege                | -       |

## Data Schemas

```javascript
USER: {
    netid: String,
    type: String,
    firstName: String,
    lastName: String,
    phone: String,
    pledgeSemester: String,
    classStanding: String,
    position: String,
    confirmed: Boolean
}

EVENT: {
    id: String,
    creator: String,
    eventType: String,
    mandatory: Boolean, // ie voting
    title: String,
    description: String,
    date: String, // ie 2019-07-02
    startTime: Number,
    endTime: Number
}

ATTENDANCE: {
    id: String,
    eventId: String,
    netid: String,
    attended: Boolean,
    excused: Boolean,
    excuse: String
}
```

## Response Schemas

POST `users/register`

```javascript
200: { // SUCCESS
    user: $USER
}
400: { // BAD REQUEST
    message: String
}
409: { // USER ALREADY EXISTS
    message: String
}
```

POST `users/login`

```javascript
200: { // SUCCESS
    token: String,
    user: $USER
}
400: { // BAD REQUEST
    message: String
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
404: { // USER DOES NOT EXIST
    message: String
}
```

GET `users/`

```javascript
200: { // SUCCESS
    users: $USER[]
}
401: { // BAD AUTH
    message: String
}
```

UPDATE `users/`

```javascript
200: { // SUCCESS
    user: $USER
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
404: { // USER DOES NOT EXIST
    message: String
}
```

POST `events/`

```javascript
200: { // SUCCESS
    event: $EVENT
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
```

POST `attendance/`

```javascript
200: { // SUCCESS
    message: String
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
```

GET `events/`

```javascript
200: { // SUCCESS
    events: [
        {
            event: $EVENT,
            users: [
                $USER['username'],
                $USER['firstName'],
                $USER['lastName']
            ]
        }
    ]
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
```

GET `attendance/users/{username}`

```javascript
200: { // SUCCESS
    events: [
        {
            event: $EVENT,
            attendance: $ATTENDANCE
        }
    ]
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
404: { // USER DOES NOT EXIST
    message: String
}
```

GET `attendance/events/{eventId}`

```javascript
200: { // SUCCESS
    users: [
        {
            user: $USER,
            events: [
                type: String,
                attended: Number,
                excused: Number,
                excuses: String[]
            ]
        }
    ]
}
401: { // BAD AUTH OR PRIVILEGE
    message: String
}
```
