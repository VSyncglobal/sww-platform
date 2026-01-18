import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export default registerAs('core', () => {
  // If running via NestJS (dist folder), we might need to adjust path, 
  // but for development 'process.cwd()' usually points to the project root.
  const configPath = path.resolve(process.cwd(), 'core-config.json');
  
  // Safe failover if file doesn't exist yet
  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️ core-config.json not found at ${configPath}. Using defaults.`);
    return { governance_mode: 'MANUAL' };
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config;
});