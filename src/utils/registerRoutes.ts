import fs from 'fs';
import path from 'path';
import { Application } from 'express';

export const registerRoutes = (app: Application) => {
  const routesDir = path.join(__dirname, '..', 'routes');
  const versions = fs.readdirSync(routesDir);

  versions.forEach((version) => {
    const versionPath = path.join(routesDir, version);
    const files = fs.readdirSync(versionPath);

    files.forEach((file) => {
      if (file.endsWith('.routes.ts') || file.endsWith('.routes.js')) {
        const route = require(path.join(versionPath, file)).default;
        const routeName = file.replace('.routes.ts', '').replace('.routes.js', '');
        app.use(`/api/${version}/${routeName}`, route);
        console.log(`✅ Loaded route: /api/${version}/${routeName}`);
      }
    });
  });
};
