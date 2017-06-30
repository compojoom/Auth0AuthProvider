/**
 * This module verifies a JWT access_token from auth0
 *
 * Copyright (C) 2017  Daniel Dimitrov <daniel@compojoom.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 3
 * of the License, or (at your option) any later version.
 */

"use strict";

const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

module.exports = function (deps) {
	return class Auth0AuthProvider extends deps.BaseAuthProvider {

		// This is used by the ROS when it loads the available
		// authentication providers. This function is required.
		static get name() {
			return 'custom/auth0';
		}

		// This is used by ROS when it parses the configuration
		// file, to ensure that required default options are
		// available. This function is optional.
		static get defaultOptions() {
			return {
				iss: undefined,
				auth_server: undefined
			}
		}

		constructor(name, options, requestPromise) {
			super(name, options, requestPromise);

			if (!this.options.auth_server) {
				throw new deps.problem.RealmProblem.ServerMisConfiguration({
					detail: 'Missing Auth0 configuration key: iss',
				});
			}

			if (!this.options.auth_server) {
				throw new deps.problem.RealmProblem.ServerMisConfiguration({
					detail: 'Missing Auth0 configuration key: auth_server',
				});
			}

			this.client = jwksClient({
				cache: true,
				rateLimit: true,
				jwksRequestsPerMinute: 5,
				jwksUri: `${this.options.auth_server}/.well-known/jwks.json`
			});

		}

		verifyIdentifier(req) {
			const token = req.body.data;

			// Decode the token without validating
			var decodedJwt = jwt.decode(token, {
				complete: true
			});

			if (!decodedJwt) {
				throw new deps.problem.HttpProblem.Unauthorized({
					detail: 'The token sent by the client was not a valid JWT',
				});
			}

			// Fail if token is not from your User Pool
			if (decodedJwt.payload.iss != this.options.iss) {
				throw new deps.problem.HttpProblem.Unauthorized({
					detail: 'The token sent by the client was not issued by the correct ISS',
				});
			}

			// Get the keyId from the token and retrieve corresponding PEM
			var kid = decodedJwt.header.kid;

			// Verify the signature of the JWT token to ensure it's really coming from your User Pool
			return new Promise((res, rej) => {

				// Get our public key
				this.client.getSigningKey(kid, (err, key) => {

					if (err) {
						throw new deps.problem.HttpProblem.Unauthorized({
							detail: 'The token sent by the client is not a valid access token',
						});
					}

					const signingKey = key.publicKey || key.rsaPublicKey;

					// Verify the access token that we have
					return jwt.verify(token, signingKey, function (err, decoded) {

						if (err) {
							// Well, we return an ExpiredRefreshToken as it seems that ROS doesn't have an error
							// for expired access token. And returning anything any other error results in a 500
							// error sent to the client and we don't want this
							if (err.name == 'TokenExpiredError') {
								rej(new deps.problem.RealmProblem.ExpiredRefreshToken());
							}
							rej(err);
						}
						else {
							// Return the user_id from the decoded access_token
							res(decoded.sub);
						}
					});
				});
			});
		}
	}
};