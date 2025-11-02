
import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.ts';
import authMiddleware from '../middleware/auth.ts'; 
import checkRole from '../middleware/role.ts'; 

const router = Router();

router.post(
  '/',
  authMiddleware,
  checkRole(['ORGANIZER']),
  async (req: Request, res: Response) => {
    try {
      
      const {
        name,
        description,
        price,
        availableSeats,
        startDate,
        endDate,
        bankAccountNumber, 
      } = req.body;
      const user = req.user as any;

      
      if (
        !name ||
        !price ||
        !availableSeats ||
        !startDate ||
        !endDate ||
        !bankAccountNumber 
      ) {
        return res.status(400).json({ message: 'Input tidak lengkap, termasuk nomor rekening' });
      }

      
      const newEvent = await prisma.event.create({
        data: {
          name,
          description,
          price: parseInt(price),
          availableSeats: parseInt(availableSeats),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          bankAccountNumber: bankAccountNumber, 
          organizerId: user.userId,
        },
      });

      res.status(201).json(newEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Kesalahan saat membuat event' });
    }
  }
);


router.get('/organizer', authMiddleware, checkRole(['ORGANIZER']), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const events = await prisma.event.findMany({
      where: {
        organizerId: user.userId,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Kesalahan saat mengambil data event organizer' });
  }
});


router.get('/', async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({

      orderBy: {
        startDate: 'asc',
      },

      include: {
        organizer: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Kesalahan saat mengambil data event' });
  }
});

router.get('/:id', async (req: Request , res: Response, ) => {
  try {
    const {id}  = req.params; 

    if (!id) {
      return res.status(400).json({ message: 'Event ID dibutuhkan' });
    }
    const event = await prisma.event.findUnique({
      where: {
        id: id,
      },
      include: {
        organizer: {
          select: {
            name: true, 
          },
        },
      },
    });

   
    if (!event) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Kesalahan saat mengambil data event' });
  }
});

router.patch(
  '/:id',
  authMiddleware,
  checkRole(['ORGANIZER']),
  async (req: Request, res: Response) => {
    try {
      const { id: eventId } = req.params;
      const user = req.user as any;
      const { name, description, price, availableSeats, startDate, endDate, bankAccountNumber } = req.body;

      // 1. Cek ID event
      if (!eventId) {
        return res.status(400).json({ message: 'Event ID dibutuhkan' });
      }

      // 2. cek event milik organizer yang login
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId: user.userId, 
        },
      });

      if (!event) {
        return res
          .status(404)
          .json({ message: 'Event tidak ditemukan atau bukan milik Anda' });
      }

      
      const updatedEvent = await prisma.event.update({
        where: {
          id: eventId,
        },
        data: {
          
          name: name || event.name,
          description: description || event.description,
          price: price ? parseInt(price) : event.price,
          availableSeats: availableSeats ? parseInt(availableSeats) : event.availableSeats,
          startDate: startDate ? new Date(startDate) : event.startDate,
          endDate: endDate ? new Date(endDate) : event.endDate,
          bankAccountNumber: bankAccountNumber || event.bankAccountNumber,
        },
      });

      res.status(200).json(updatedEvent);
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: `Kesalahan server: ${error.message}` });
    }
  }
);




export default router;