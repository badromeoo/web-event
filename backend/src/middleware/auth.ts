
import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function authMiddleware(req: Request, res: Response, next: NextFunction)  {
  try {
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      
      console.error('JWT_SECRET tidak disetel di server.');
      return res.status(500).json({ message: 'Kesalahan konfigurasi server' });
    }

    
    const authHeader = req.headers.authorization;

    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Akses ditolak: Tidak ada token' });
    }

    
    const token = authHeader.split(' ')[1];

    
    if (!token) {
      return res.status(401).json({ message: 'Akses ditolak: Format token salah' });
    }

    
    const decodedPayload = jwt.verify(
      token, 
      secret 
    );

    
    req.user = decodedPayload;

    
    next();

  } catch (error) {
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: `Akses ditolak: ${error.message}` });
    }

    
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan di server' });
  }
};

export default authMiddleware;