import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import scenarioRouter from './test-scenarios'; // Adjust the import path

const app = express();
app.use(express.json());
app.use('/scenarios', scenarioRouter);

const testScenarioDir = path.join(__dirname, '../../data/test-scenarios');

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actualFs: any = await importOriginal(); // Import the actual fs module
  return {
    ...actualFs, // Keep all actual fs methods
    existsSync: vi.fn(), // Mock existsSync method
    readdirSync: vi.fn(), // Mock readdirSync method
    readFileSync: vi.fn(), // Mock readFileSync method
    writeFileSync: vi.fn(), // Mock writeFileSync method
  };
});

beforeAll(() => {
  // Make sure the mock fs works as expected during tests
  vi.mocked(fs.existsSync).mockReturnValue(true);

  // Mock fs.readdirSync to return Dirent-like objects
  const dirent1 = { name: 'testScenario1.json', isFile: vi.fn(() => true) } as unknown as fs.Dirent;
  const dirent2 = { name: 'testScenario2.json', isFile: vi.fn(() => true) } as unknown as fs.Dirent;
  
  vi.mocked(fs.readdirSync).mockReturnValue([dirent1, dirent2]);
});

afterAll(() => {
  // Clear mocks after the tests run
  vi.restoreAllMocks();
});

describe('Scenario Routes', () => {
  it('should list all saved scenarios', async () => {
    const response = await request(app).get('/scenarios');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ scenarios: ['testScenario1.json', 'testScenario2.json'] });
  });

  it('should return a 404 if scenario is not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false); // Simulate file not found

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
    const invalidData = { filename: 'newScenario' }; // Missing data
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
