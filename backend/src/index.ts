

import express, { type Request, type Response } from 'express';
import authRouter from './routes/auth.ts'; 
import cors from 'cors'; 

const app = express();
const PORT = 8000;


app.use(cors()); 
app.use(express.json()); 

app.get('/', (req: Request, res: Response) => {
  res.send('Halo! Server backend Event Platform berjalan!');
});


app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});