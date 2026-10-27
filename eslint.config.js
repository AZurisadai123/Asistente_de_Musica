// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

/** Librerías de infraestructura que el núcleo (domain + application) no puede importar. */
const INFRASTRUCTURE_MODULES = [
  '@angular/*',
  'rxjs',
  'rxjs/*',
  'tone',
  '@tonejs/*',
  'opensheetmusicdisplay',
  'vexflow',
  '@spotify/*',
  '@tensorflow/*',
];

const TONAL_MESSAGE = 'Usa los helpers de domain/theory en vez de importar Tonal directamente.';
const CORE_MESSAGE =
  'El núcleo no depende de infraestructura: define un puerto en application/ports.';

/**
 * Construye las opciones de no-restricted-imports. En flat config la última definición de una
 * regla gana, así que cada carpeta recibe una sola lista completa.
 * @param {{ tonal?: boolean, infrastructure?: boolean }} options
 */
function restrictedImports({ tonal = false, infrastructure = false }) {
  const patterns = [];
  if (tonal) patterns.push({ group: ['tonal', '@tonaljs/*'], message: TONAL_MESSAGE });
  if (infrastructure) patterns.push({ group: INFRASTRUCTURE_MODULES, message: CORE_MESSAGE });
  return { patterns };
}

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Regla del proyecto: ningún archivo pasa de 300 líneas (se cuentan todas).
      'max-lines': ['error', { max: 300, skipBlankLines: false, skipComments: false }],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/app/domain/**', partialMatch: false },
        { type: 'application', pattern: 'src/app/application/**', partialMatch: false },
        { type: 'adapters', pattern: 'src/app/adapters/**', partialMatch: false },
        { type: 'ui', pattern: 'src/app/ui/**', partialMatch: false },
        // Raíz de composición: conecta puertos con adaptadores.
        { type: 'composition', pattern: 'src/app', partialMatch: false },
        { type: 'composition', pattern: 'src', partialMatch: false },
      ],
    },
    rules: {
      // Arquitectura hexagonal: las dependencias solo apuntan hacia el dominio.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              allow: { to: { element: { type: 'domain' } } },
            },
            {
              from: { element: { type: 'application' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'application'] } } } },
            },
            {
              from: { element: { type: 'adapters' } },
              allow: {
                to: { element: { types: { anyOf: ['domain', 'application', 'adapters'] } } },
              },
            },
            {
              from: { element: { type: 'ui' } },
              allow: { to: { element: { types: { anyOf: ['domain', 'application', 'ui'] } } } },
            },
            {
              from: { element: { type: 'composition' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['domain', 'application', 'adapters', 'ui', 'composition'] },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    // Tonal.js solo puede usarse desde domain/theory.
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/domain/theory/**'],
    rules: { 'no-restricted-imports': ['error', restrictedImports({ tonal: true })] },
  },
  {
    // El núcleo es TypeScript puro: sin Angular, sin navegador, sin librerías de audio.
    files: ['src/app/domain/**/*.ts', 'src/app/application/**/*.ts'],
    ignores: ['src/app/domain/theory/**'],
    rules: {
      'no-restricted-imports': ['error', restrictedImports({ tonal: true, infrastructure: true })],
    },
  },
  {
    files: ['src/app/domain/theory/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', restrictedImports({ infrastructure: true })] },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
