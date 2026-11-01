import { Global, Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { SiteAccessGuard } from './guards/site-access.guard';
import { AuthService } from './services/auth.service';
import { AuthorizationService } from './services/authorization.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    PasswordService,
    SessionService,
    AuthorizationService,
    AuthService,
    AuthGuard,
    PermissionsGuard,
    SiteAccessGuard,
    CsrfGuard,
  ],
  exports: [
    PasswordService,
    SessionService,
    AuthorizationService,
    AuthService,
    AuthGuard,
    PermissionsGuard,
    SiteAccessGuard,
    CsrfGuard,
  ],
})
export class AuthModule {}
