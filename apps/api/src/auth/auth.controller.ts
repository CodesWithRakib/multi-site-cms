import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser, CsrfResponse, LoginResponse } from '@multi-site-cms/types';
import type { Request, Response } from 'express';

import { env } from '../config/env';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './services/auth.service';
import { AuthorizationService } from './services/authorization.service';
import type { EffectiveAuthContext } from './services/authorization.service';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME, SessionService } from './services/session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request & { cookies?: Record<string, string>; id?: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const oldSessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    const ipAddress = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login({
      email: dto.email,
      password: dto.password,
      ipAddress,
      userAgent,
      oldSessionToken,
      requestId: req.id,
    });

    const isProd = env.NODE_ENV === 'production';
    // Cookies expire with the server-side session (settings: session TTL).
    const maxAge = Math.max(0, result.expiresAt.getTime() - Date.now());

    res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return {
      user: result.user,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req()
    req: Request & {
      cookies?: Record<string, string>;
      id?: string;
      authContext?: EffectiveAuthContext;
    },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] ?? this.extractBearer(req);
    const ipAddress = req.ip ?? req.socket.remoteAddress;

    if (rawToken) {
      await this.authService.logout({
        rawToken,
        userId: req.authContext?.user.id,
        ipAddress,
        requestId: req.id,
      });
    }

    const isProd = env.NODE_ENV === 'production';

    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie(CSRF_COOKIE_NAME, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  }

  /** The signed-in user changes their own password (any role). */
  @Post('password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request & { cookies?: Record<string, string>; id?: string },
  ): Promise<{ success: boolean }> {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] ?? this.extractBearer(req) ?? '';
    await this.authService.changePassword({
      userId: authContext.user.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      currentRawToken: rawToken,
      ipAddress: req.ip ?? req.socket.remoteAddress,
      requestId: req.id,
    });
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() authContext: EffectiveAuthContext): Promise<AuthUser> {
    return this.authorizationService.toAuthUser(authContext);
  }

  @Public()
  @Get('csrf')
  async csrf(@Res({ passthrough: true }) res: Response): Promise<CsrfResponse> {
    const csrfToken = this.sessionService.generateCsrfToken();
    const isProd = env.NODE_ENV === 'production';

    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { csrfToken };
  }

  private extractBearer(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return null;
  }
}
