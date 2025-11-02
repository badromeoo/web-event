
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';


declare global {
  namespace Express {
    export interface Request {
      user?: string | JwtPayload; // user bisa jadi string atau objek payload JWT
    }
  }
}