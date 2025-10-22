import {Router, type Request, type Response} from 'express';
import jwt from 'jsonwebtoken'
import prisma from "../lib/prisma.ts";
import bcrypt from 'bcrypt';


const router = Router();

router.post("/register", async (req, res) => {
    try {
        const {email, password, name}= req.body;

        if (!email || !password ) {
            return res.status(400).json({message: "Email dan password dibutuhkan"})
        }

        const existingUser = await prisma.user.findUnique({
            where: {email: email}
        });

        if (existingUser) {
            return res.status(400).json({message: "Email ini sudah terdaftar"})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await  prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                name: name,
            }
        });

        const {password: _, ...userWithoutPassword} = newUser;
        res.status(201).json(userWithoutPassword);



    }
    catch (error) {
        console.error(error);
        res.status(500).json({message: "terjadi kesalahan di server"});
    }
});

router.post('/login', async (req: Request, res: Response) => { 
  try {
    const { email, password } = req.body; 

    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password dibutuhkan' }); 
    }

    
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' }); 
    }

    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' }); 
    }

    
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    
    res.status(200).json({ 
      message: 'Login berhasil',
      token: token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan di server' }); 
  }
});

export default router;



