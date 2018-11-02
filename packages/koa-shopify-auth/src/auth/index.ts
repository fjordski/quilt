import {readFileSync} from 'fs';
import {join} from 'path';
import {Context} from 'koa';

import {OAuthStartOptions, AccessMode, NextFunction} from '../types';
import createOAuthStart from './create-oauth-start';
import createOAuthCallback from './create-oauth-callback';
import createEnableCookies from './create-enable-cookies';
import createEnableCookiesRedirect from './create-enable-cookies-redirect';
import createTopLevelOAuthRedirect from './create-top-level-oauth-redirect';

const DEFAULT_MYSHOPIFY_DOMAIN = 'myshopify.com';
const DEFAULT_ACCESS_MODE: AccessMode = 'online';

export const TOP_LEVEL_OAUTH_COOKIE_NAME = 'shopify.top_level_oauth';
export const TEST_COOKIE_NAME = 'shopify.cookies_persist';

function readTemplate(fname: string) {
  return readFileSync(join(__dirname, '../../client', `${fname}.js`)).toString();
}

function hasCookieAccess({cookies}: Context) {
  return Boolean(cookies.get(TEST_COOKIE_NAME));
}

function shouldPerformInlineOAuth({cookies}: Context) {
  return Boolean(cookies.get(TOP_LEVEL_OAUTH_COOKIE_NAME));
}

// function userAgentCanPartitionCookies(context: Context) {
//   return context.request.header['user-agent'].match(
//     /Version\/12\.0\.?\d? Safari/,
//   );
// }

export default function createShopifyAuth(options: OAuthStartOptions) {
  const config = {
    scopes: [],
    prefix: '',
    myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN,
    accessMode: DEFAULT_ACCESS_MODE,
    ...options,
  };

  const {prefix} = config;

  const oAuthStartPath = `${prefix}/auth`;
  const oAuthCallbackPath = `${oAuthStartPath}/callback`;

  const oAuthStart = createOAuthStart(config, oAuthCallbackPath);
  const oAuthCallback = createOAuthCallback(config);

  const inlineOAuthPath = `${prefix}/auth/inline`;
  const topLevelOAuthRedirect = createTopLevelOAuthRedirect(inlineOAuthPath);

  const enableCookiesPath = `${oAuthStartPath}/enable_cookies`;
  const enableCookies = createEnableCookies(
    config,
    readTemplate('enable-cookies'),
  );
  const enableCookiesRedirect = createEnableCookiesRedirect(enableCookiesPath);

  const topLevelInteractionPath = `${prefix}/auth/top_level_interaction`;
  const topLevelInteraction = createEnableCookies(
    config,
    readTemplate('top-level'),
  );

  return async function shopifyAuth(ctx: Context, next: NextFunction) {
    if (ctx.path === oAuthStartPath && !hasCookieAccess(ctx)) {
      await enableCookiesRedirect(ctx);
      return;
    }

    if (
      ctx.path === inlineOAuthPath ||
      (ctx.path === oAuthStartPath && shouldPerformInlineOAuth(ctx))
    ) {
      await oAuthStart(ctx);
      return;
    }

    if (ctx.path === oAuthStartPath) {
      await topLevelOAuthRedirect(ctx);
      return;
    }

    if (ctx.path === oAuthCallbackPath) {
      await oAuthCallback(ctx);
      return;
    }

    if (ctx.path === enableCookiesPath) {
      await enableCookies(ctx);
      return;
    }

    if (ctx.path === topLevelInteractionPath) {
      await topLevelInteraction(ctx);
      return;
    }

    await next();
  };
}
    // if (navigator.userAgent.indexOf('com.jadedpixel.pos') !== -1) {
    //   return false;
    // }

    // if (navigator.userAgent.indexOf('Shopify Mobile/iOS') !== -1) {
    //   return false;
    // }


export {default as Error} from './errors';
export {default as validateHMAC} from './validate-hmac';
