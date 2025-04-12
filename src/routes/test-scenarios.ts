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
