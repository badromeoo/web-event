import {Router} from 'express';
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

export default router;

