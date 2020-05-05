import { OAuth2Client } from 'google-auth-library';
import { pass, fail } from 'utils/res';

export const verifyToken = async (token, email) => {
  try {
    const client = new OAuth2Client('223233671218-v5meaa316pd8mgar3mgcvsmg3td7qnl6.apps.googleusercontent.com');

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: [
        '223233671218-ceilcecpn0t04ec5or3tk680pfoomf4v.apps.googleusercontent.com',
        '223233671218-joevmt53u95c0o70mttjrodcbd5nj23j.apps.googleusercontent.com',
        '223233671218-v5meaa316pd8mgar3mgcvsmg3td7qnl6.apps.googleusercontent.com',
        '223233671218-6pfiu8hqonhkhugvf2jb4burtij54tru.apps.googleusercontent.com'
      ]
    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return fail({
        message: 'email not verified'
      });
    }

    if (payload.email.toLowerCase() !== email.toLowerCase()) {
      return fail({
        message: 'email mismatch'
      });
    }

    return pass({
      familyName: payload.family_name,
      givenName: payload.given_name
    });
  } catch (error) {
    return fail(error);
  }
};
