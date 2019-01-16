import { pick } from 'lodash';
import { AuthModule } from '@module/authentication-server-ts';
import { onAuthenticationSuccess, registerUser } from '../shared';
import User from '../../sql';

import resolvers from './resolvers';
import settings from '../../../../../settings';

const createGithubAuth = async user => User.createGithubAuth(user);

async function verifyCallback(accessToken, refreshToken, profile, cb) {
  const {
    id,
    displayName,
    emails: [{ value }]
  } = profile;

  try {
    let user = await User.getUserByGHIdOrEmail(id, value);

    if (!user) {
      const [createdUserId] = await registerUser(profile);
      await createGithubAuth({ id, displayName, userId: createdUserId });
      user = await User.getUser(createdUserId);
    } else if (!user.lnId) {
      await createGithubAuth({ id, displayName, userId: user.id });
    }

    return cb(null, pick(user, ['id', 'username', 'role', 'email']));
  } catch (err) {
    return cb(err, {});
  }
}

export const githubData = {
  github: {
    onAuthenticationSuccess,
    verifyCallback
  }
};

export default (settings.auth.social.github.enabled && !__TEST__
  ? new AuthModule({ createResolversFunc: [resolvers] })
  : undefined);
