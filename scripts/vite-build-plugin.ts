import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

const ROOT = resolve(__dirname, '..');
const PACKAGE_PATH = resolve(ROOT, 'package.json');

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function bumpPatchVersion(version: string): string {
  const parts = version.split('.').map((part) => parseInt(part, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.join('.');
}

function writePackageVersion(version: string): void {
  const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
  pkg.version = version;
  writeFileSync(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
}

function buildHtaccess(): string {
  return `# Generado automáticamente en el build de Z Movilidad Intranet
# Despliegue: https://zmovilidad.app/intranet/
Options -MultiViews
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /intranet/

  # Archivos y directorios existentes (assets, vale.html, mt.html, version.json, etc.)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # SPA: redirigir el resto a index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Caché corta para version.json (detección de actualizaciones)
<IfModule mod_headers.c>
  <Files "version.json">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
  </Files>
</IfModule>
`;
}

/**
 * Plugin Vite:
 * - Incrementa la versión en package.json en cada build
 * - Inyecta VITE_APP_VERSION
 * - Escribe dist/version.json y dist/.htaccess
 */
export function zmovilidadBuildPlugin(): Plugin {
  let appVersion = readPackageVersion();
  let isBuild = false;

  return {
    name: 'zmovilidad-build-plugin',
    config(_userConfig, env) {
      isBuild = env.command === 'build';

      if (isBuild && process.env.VITE_SKIP_VERSION_BUMP !== '1') {
        const current = readPackageVersion();
        appVersion = bumpPatchVersion(current);
        writePackageVersion(appVersion);
        console.log(`\n[zmovilidad] Versión actualizada: ${current} → ${appVersion}\n`);
      } else {
        appVersion = readPackageVersion();
      }

      return {
        define: {
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
        },
      };
    },
    closeBundle() {
      if (!isBuild) return;

      const distDir = resolve(ROOT, 'dist');
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }

      const versionPayload = {
        version: appVersion,
        builtAt: new Date().toISOString(),
      };

      writeFileSync(
        resolve(distDir, 'version.json'),
        `${JSON.stringify(versionPayload, null, 2)}\n`,
        'utf-8'
      );
      writeFileSync(resolve(distDir, '.htaccess'), buildHtaccess(), 'utf-8');
      console.log(`[zmovilidad] Generados dist/version.json (v${appVersion}) y dist/.htaccess`);
    },
  };
}
