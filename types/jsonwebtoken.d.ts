declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
    exp?: number;
    iat?: number;
  }

  export function sign(payload: object | string, secret: string, options?: any): string;
  export function verify(token: string, secret: string): JwtPayload;
}
