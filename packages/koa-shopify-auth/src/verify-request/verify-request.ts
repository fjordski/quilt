import {Context} from 'koa';

import {NextFunction} from '../types';
import {TEST_COOKIE_NAME, TOP_LEVEL_OAUTH_COOKIE_NAME} from '../index';

export interface Options {
  authRoute?: string;
  fallbackRoute?: string;
}

export default function verifyRequest({
  authRoute = '/auth',
  fallbackRoute = '/auth',
}: Options = {}) {
  return async function verifyRequestMiddleware(
    ctx: Context,
    next: NextFunction,
  ) {
    const {
      query: {shop},
      session,
    } = ctx;

    session.authRoute = authRoute;

    if (session && session.accessToken) {
      if (!ctx.cookies.get(TEST_COOKIE_NAME)) {
        console.log('no test cookie');
        if (ctx.cookies.get(TOP_LEVEL_OAUTH_COOKIE_NAME)) {
          console.log('top level');
          // has interacted with top level, can call requestStorageAccess
          ctx.redirect(`/shopify/auth/enable_cookies?shop=${shop}`);
          return;
        } else {
          console.log('no top level');
          // has not interacted with top level
          ctx.redirect(`/shopify/auth/top_level_interaction?shop=${shop}`);
          return;
        }
      }

      await next();
      return;
    }

    ctx.cookies.set(TEST_COOKIE_NAME, '1');

    if (shop) {
      ctx.redirect(`${authRoute}?shop=${shop}`);
      return;
    }

    ctx.redirect(fallbackRoute);
  };
}
