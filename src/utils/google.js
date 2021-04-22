import { OAuth2Client } from 'google-auth-library';
import { pass, fail } from 'utils/res';
import { GOOGLE_AUDIENCES, PRIMARY_AUDIENCE } from '../secrets';

export const verifyToken = async (token, email) => {
  try {
    const client = new OAuth2Client(PRIMARY_AUDIENCE);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_AUDIENCES
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
