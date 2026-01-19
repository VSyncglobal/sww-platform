import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export default registerAs('core', () => {
  // Point to core-config.json in the root
  const configPath = path.resolve(process.cwd(), 'core-config.json');
  
  // Safe failover if file doesn't exist
  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️ core-config.json not found at ${configPath}. Using defaults.`);
    return { 
      governance_mode: 'MANUAL',
      features: {
        auto_loan_approval: false,
        strict_guarantor_check: true
      }
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config;
  } catch (error) {
    console.error('Error parsing core-config.json', error);
    return { governance_mode: 'MANUAL' };
  }
});