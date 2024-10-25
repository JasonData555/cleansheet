import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileProcessor } from './fileProcessor.js';
import { DataCleaner } from './dataCleaner.js';
import { DatabaseManager } from './databaseManager.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://cleansheet-frontend.onrender.com']
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const dbManager = new DatabaseManager();
const dataCleaner = new DataCleaner(dbManager);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const data = fileProcessor.parseFile(file.buffer, file.originalname);
    const tableId = await dbManager.createTable(data);
    
    res.json({ tableId, preview: data.slice(0, 5) });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

app.post('/clean', async (req, res) => {
  try {
    const { tableId, commands } = req.body;
    if (!tableId || !commands) {
      return res.status(400).json({ error: 'Missing tableId or commands' });
    }

    const cleanedData = await dataCleaner.processCommands(tableId, commands);
    res.json({ preview: cleanedData.slice(0, 5) });
  } catch (error) {
    console.error('Cleaning error:', error);
    res.status(500).json({ error: 'Failed to clean data' });
  }
});

app.get('/download/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const format = req.query.format || 'csv';
    
    const data = await dbManager.getData(tableId);
    const buffer = fileProcessor.generateFile(data, format);
    
    res.setHeader('Content-Type', fileProcessor.getMimeType(format));
    res.setHeader('Content-Disposition', `attachment; filename=cleaned-data.${format}`);
    res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
