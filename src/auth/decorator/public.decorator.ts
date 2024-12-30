import { Reflector } from '@nestjs/core';

// AuthGuard를 통과시키기 위한 decorator
// Public API로 만든다.
export const Public = Reflector.createDecorator();
