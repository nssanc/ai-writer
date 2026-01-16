#!/usr/bin/env node

import { initDatabase } from '../lib/db.ts';

console.log('Initializing database...');
initDatabase();
console.log('Database initialization complete!');
