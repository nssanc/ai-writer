#!/usr/bin/env node

import { initDatabase } from '../lib/db';
import { initDefaultTemplates } from './init-templates';

console.log('Initializing database...');
initDatabase();
console.log('Database initialization complete!');

console.log('Initializing default templates...');
initDefaultTemplates();
console.log('Template initialization complete!');
