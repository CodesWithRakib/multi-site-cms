import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const REQUIRE_SITE_CONTEXT_KEY = 'requireSiteContext';

export const RequireSiteContext = (): CustomDecorator<string> =>
  SetMetadata(REQUIRE_SITE_CONTEXT_KEY, true);
