
import { type Request, type Response, type NextFunction } from 'express';


const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const user = req.user as any;

      if (!user || !user.role) {
        return res.status(403).json({ message: 'Akses ditolak: Tidak ada peran' });
      }

      
      if (!roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: 'Akses ditolak: Peran tidak diizinkan' });
      }

      
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Kesalahan saat verifikasi peran' });
    }
  };
};

export default checkRole;