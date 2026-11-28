import { Injectable, Module, SetMetadata, type DynamicModule } from '@nestjs/common';

@Module({})
export class ThrottlerModule {
  static forRoot(_options: unknown[]): DynamicModule {
    return { module: ThrottlerModule };
  }
}

@Injectable()
export class ThrottlerGuard {
  canActivate(): boolean {
    return true;
  }
}

export const Throttle = (options: unknown) => SetMetadata('test:throttle', options);
