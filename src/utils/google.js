import { OAuth2Client } from 'google-auth-library';

export const verifyToken = async (token, email) => {
  try {
    const client = new OAuth2Client('223233671218-ceilcecpn0t04ec5or3tk680pfoomf4v.apps.googleusercontent.com');

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: [
        '223233671218-ceilcecpn0t04ec5or3tk680pfoomf4v.apps.googleusercontent.com',
        '223233671218-joevmt53u95c0o70mttjrodcbd5nj23j.apps.googleusercontent.com'
      ]
    });

    const payload = ticket.getPayload();

    if (payload.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: {
          message: 'email mismatch'
        }
      };
    }

    return {
      success: true,
      data: {
        familyName: payload.family_name,
        givenName: payload.given_name
      }
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};
