##[Realm](https://realm.io/docs/realm-object-server/) [auth0](https://auth0.com/) Authenticator
This package would verify (on the Real Object Server) a JWT access_token issued by the auth0 service

##Usage
Installation:
```
npm install realm-auth0-authenticator
```
or

```
yarn add realm-auth0-authenticator
```

In your ROS configuration.yaml add the following code to the Providers section:

```yaml
  custom/auth0:
    include_path: PATH_TO/realm-auth0-authenticator
    auth_server: AUTH_SERVER_URL
    iss: ISS
```

include_path should point to this package directory.
Auth_server is the auth0 domain name for your account that holds your JSON web key (JWK)
iss is the unique identifier for the API that you've setup in auth0


Start your ROS and you are ready to go. Follow the Realm documentation on using a custom Auth 

```js
// The user token provided by your authentication server
const accessToken = 'acc3ssT0ken...';

const user = Realm.Sync.User.registerWithProvider(
  'http://my.realm-auth-server.com:9080',
  'custom/auth0',
  accessToken,
  (error, user) => { /* ... */ }
);
```

More info [here](https://realm.io/docs/javascript/latest/#sync)

Please note:
If you send an expired access token the script would return a 403 error
with a message Expired Refresh Token. Using the Expired Refresh token was the only way
I found to force a different error code than 500. You shouldn't send a refresh token to the server! 
This code doesn't know how to handle it. Instead you should refresh your token on your client and send the new token
to ROS

##Contributions
All contributions are welcome

##LICENSE
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
