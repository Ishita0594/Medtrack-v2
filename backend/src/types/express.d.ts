import { UserRole } from '../users/enums/user-role.enum';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string;
      email: string;
      role: UserRole | string;
    };
  }
}
