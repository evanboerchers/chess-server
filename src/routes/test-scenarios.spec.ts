import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import scenarioRouter from './test-scenarios'; // Adjust the import path

type Fn = ReturnType<typeof vi.fn>

const app = express();
app.use(express.json());
app.use('/scenarios', scenarioRouter);

const testScenarioDir = path.join(__dirname, '../../data/test-scenarios');

vi.mock('fs', async (importOriginal) => {
  const actualFs = await importOriginal<typeof import('fs')>(); // Import the actual fs module
  return {
    default: {
      ...actualFs,
      existsSync: vi.fn(), 
      readdirSync: vi.fn(), 
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
    }
  };
});

beforeAll(() => {
  (fs.existsSync as Fn).mockReturnValue(true);
  (fs.readdirSync as Fn).mockReturnValue(['testScenario1.json', 'testScenario2.json']);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Scenario Routes', () => {
  it('should list all saved scenarios', async () => {
    const response = await request(app).get('/scenarios');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ scenarios: ['testScenario1.json', 'testScenario2.json'] });
  });

  it('should return a 404 if scenario is not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false); 

    const response = await request(app).get('/scenarios/nonExistentScenario.json');
    
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'File not found: nonExistentScenario.json' });
  });

  it('should return the scenario data', async () => {
    const mockData = { name: 'Test Scenario', value: 123 };
    vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify(mockData));

    const response = await request(app).get('/scenarios/testScenario1.json');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockData);
  });

  it('should return a 500 error if reading file fails', async () => {
    vi.mocked(fs.readFileSync).mockImplementationOnce(() => { throw new Error('Failed to read file'); });

    const response = await request(app).get('/scenarios/testScenario1.json');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to get file: testScenario1.json' });
  });

  it('should save a new scenario', async () => {
    const scenarioData = { filename: 'newScenario', data: { name: 'New Scenario', value: 456 } };
    const response = await request(app).post('/scenarios').send(scenarioData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Scenario saved as newScenario.json' });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(testScenarioDir, 'newScenario.json'),
      JSON.stringify(scenarioData.data, null, 2)
    );
  });

  it('should return a 400 error if filename or data is missing in POST request', async () => {
    const invalidData = { filename: 'newScenario' }; 
    const response = await request(app).post('/scenarios').send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Filename and data are required' });
  });

  it('should return a 500 error if saving scenario fails', async () => {
    vi.mocked(fs.writeFileSync).mockImplementationOnce(() => { throw new Error('Failed to save file'); });

    const scenarioData = { filename: 'newScenario', data: { name: 'New Scenario', value: 456 } };
    const response = await request(app).post('/scenarios').send(scenarioData);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to save scenario' });
  });
});
