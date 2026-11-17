import { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RolUsuario } from '../../usuarios/entities/usuario.entity';

function contextWithRole(rol: RolUsuario): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 'user-1', email: 'user@example.com', rol } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows a user with a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([RolUsuario.ADMIN]),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(contextWithRole(RolUsuario.ADMIN))).toBe(true);
  });

  it('rejects a user without a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([RolUsuario.ADMIN]),
    } as unknown as Reflector;

    expect(() => new RolesGuard(reflector).canActivate(contextWithRole(RolUsuario.CLIENTE))).toThrow(
      'No tienes permisos',
    );
  });
});
