
import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.ts';
import authMiddleware from '../middleware/auth.ts'; 
import checkRole from '../middleware/role.ts'; 
import multer from 'multer'; 
import supabase from '../lib/supabase.ts'



const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get(
  '/my',
  authMiddleware, 
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId,
        },
        include: {
          event: {
            
            select: {
              name: true,
              startDate: true,
              bankAccountNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc', 
        },
      });

      res.status(200).json(transactions);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: 'Kesalahan saat mengambil data transaksi' });
    }
  }
);

router.get(
  '/organizer',
  authMiddleware,
  checkRole(['ORGANIZER']), 
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

     
      const transactions = await prisma.transaction.findMany({
        where: {
          
          event: {
            
            organizerId: user.userId,
          },
        },
        include: {
          event: { select: { name: true } }, 
          user: { select: { name: true, email: true } }, 
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json(transactions);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: 'Kesalahan saat mengambil data transaksi' });
    }
  }
);


router.post(
  '/',
  authMiddleware,
  checkRole(['CUSTOMER']), 
  async (req: Request, res: Response) => {
    try {
      
      const { eventId } = req.body; 
      const user = req.user as any; 

      if (!eventId) {
        return res.status(400).json({ message: 'Event ID dibutuhkan' });
      }

      
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return res.status(404).json({ message: 'Event tidak ditemukan' });
      }
      if (event.availableSeats <= 0) {
        return res.status(400).json({ message: 'Tiket sudah habis' });
      }

      
      const transactionResult = await prisma.$transaction(async (tx) => {
        
        const updatedEvent = await tx.event.update({
          where: { id: eventId },
          data: {
            availableSeats: {
              decrement: 1, 
            },
          },
        });

        
        if (updatedEvent.availableSeats < 0) {
          
          throw new Error('Tiket sudah habis terjual saat proses.');
        }

        
        const newTransaction = await tx.transaction.create({
          data: {
            status: 'WAITING_FOR_PAYMENT', 
            eventId: eventId,
            userId: user.userId,
            
          },
        });

        return newTransaction;
      });

     
      res.status(201).json(transactionResult);

    } catch (error: any) {
      console.error(error);
      
      if (error.message.includes('Tiket sudah habis')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Kesalahan saat membuat transaksi' });
    }
  }
);

router.patch(
  '/:id/upload',
  authMiddleware, 
  upload.single('proof'), 
  async (req: Request, res: Response) => {
    try {
      const { id: transactionId } = req.params; 
      const user = req.user as any;
      const file = req.file; 

     if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID dibutuhkan' });
      }

      if (!file) {
        return res.status(400).json({ message: 'Tidak ada file di-upload' });
      }

      // 2. Cek apakah transaksi ini milik user yang login
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId: user.userId,
        },
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ message: 'Transaksi tidak ditemukan atau bukan milik Anda' });
      }

     
      const fileExt = file.mimetype.split('/')[1]; 
      const fileName = `proofs/${user.userId}/${transactionId}-${Date.now()}.${fileExt}`;

      
      const { data, error: uploadError } = await supabase.storage
        .from('payment_proofs') 
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw uploadError;
      }

     
      const { data: publicUrlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);

      
      const updatedTransaction = await prisma.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          paymentProofUrl: publicUrlData.publicUrl, 
          status: 'WAITING_FOR_CONFIRMATION', 
        },
      });

      res.status(200).json(updatedTransaction);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: `Kesalahan server: ${error.message}` });
    }
  }
);

router.patch(
  '/:id/manage',
  authMiddleware,
  checkRole(['ORGANIZER']), 
  async (req: Request, res: Response) => {
    try {
      const { id: transactionId } = req.params;
      const { status } = req.body; 
      const user = req.user as any;

     
      if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID dibutuhkan' });
      }
      if (!status || (status !== 'DONE' && status !== 'REJECTED')) {
        return res
          .status(400)
          .json({ message: "Status harus 'DONE' atau 'REJECTED'" });
      }

      
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          event: {
            organizerId: user.userId,
          },
        },
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ message: 'Transaksi tidak ditemukan atau bukan milik Anda' });
      }

      
      if (
        transaction.status === 'DONE' ||
        transaction.status === 'REJECTED'
      ) {
        return res
          .status(400)
          .json({ message: 'Transaksi ini sudah diproses' });
      }

      
      if (status === 'DONE') {
       
        const updatedTransaction = await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: 'DONE' },
        });
        res.status(200).json(updatedTransaction);
      } else if (status === 'REJECTED') {
        
        const updatedTransaction = await prisma.$transaction(async (tx) => {
        
          const txUpdated = await tx.transaction.update({
            where: { id: transactionId },
            data: { status: 'REJECTED' },
          });

          
          await tx.event.update({
            where: { id: transaction.eventId },
            data: {
              availableSeats: {
                increment: 1,
              },
            },
          });

          return txUpdated;
        });

        res.status(200).json(updatedTransaction);
      }
    } catch (error: any) {
      console.error('Error managing transaction:', error);
      res.status(500).json({ message: `Kesalahan server: ${error.message}` });
    }
  }
);

export default router;