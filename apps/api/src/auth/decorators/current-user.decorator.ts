import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { EffectiveAuthContext } from '../services/authorization.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EffectiveAuthContext | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { authContext?: EffectiveAuthContext }>();
    return request.authContext;
  },
);
