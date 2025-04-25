import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const scenarioDir = path.join(import.meta.dirname , '../../data/test-scenarios'); // Adjust based on project structure

// Ensure the directory exists
if (!fs.existsSync(scenarioDir)) {
  fs.mkdirSync(scenarioDir, { recursive: true });
}

// GET: List all saved scenarios
router.get('/', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(scenarioDir);
    res.json({ scenarios: files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list scenarios' });
  }
});

// GET: List a saved scenario
router.get('/:fileName', (req: Request, res: Response) => {
  const filePath = path.join(scenarioDir, req.params.fileName); // Assuming your JSON files are in a 'scenarios' folder
  
  try {
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: `File not found: ${req.params.fileName}` });
      return
    }

    const file = fs.readFileSync(filePath, 'utf-8'); 
    const jsonData = JSON.parse(file); 

    res.json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Failed to get file: ${req.params.fileName}` });
  }
});

// POST: Save a new scenario
router.post('/', (req: Request, res: Response) => {
  try {
    const { filename, data } = req.body;

    if (!filename || !data) {
      res.status(400).json({ error: 'Filename and data are required' });
      return;
    }

    const filePath = path.join(scenarioDir, `${filename}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.status(201).json({ message: `Scenario saved as ${filename}.json` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save scenario' });
  }
});

export default router;
