/**
 * Generate version file for the app
 *
 * This module extracts the version from package.json and creates a JavaScript module
 * that exports the version as a string. It can be used as a standalone function or as
 * a Vite plugin to automatically update the version file during builds or in development mode.
 *
 * The generated version file can be imported in your application to display version
 * information to users or for telemetry purposes. The module automatically updates
 * the version when package.json changes during development.
 *
 * Usage:
 * - As a standalone function: Call generateVersionFile() with input/output paths and options
 * - As a Vite plugin: Import versionPlugin in vite.config.js
 * @module generate-version
 * @exports generateVersionFile - Creates a version file from package.json
 * @exports absolutePath - Utility for path normalization
 * @exports versionPlugin - Vite plugin for automatic version generation
 */

// https://github.com/MichinobuMaeda/xuan-paper/blob/main/tools/generate-version.js

import * as fs from "node:fs/promises";
import path from "path";
import process from "process";

/**
 * Configuration for version generation
 * @typedef {object} VersionConfig
 * @property {string} input - The path to the input file (usually package.json)
 *   This file must contain a "version" field in valid JSON format
 * @property {string} output - The path to the output version file
 *   The generated file will export the version as a string default export
 * @property {object} [options] - Additional configuration options
 * @property {boolean} [options.silent=false] - Whether to suppress console output
 * @property {string} [options.exportName='version'] - Name to use for named exports
 * @property {string} [options.template] - Custom template for version file content
 *   Template should include "{version}" which will be replaced with the actual version
 */

/**
 * Generates a version file by extracting the version from a JSON file
 * (typically package.json) and writing it to a JavaScript module file
 *
 * This function:
 * 1. Reads the input JSON file (usually package.json)
 * 2. Extracts the "version" field
 * 3. Creates a JavaScript module file that exports this version
 *
 * The generated file will contain: `export default "x.y.z";`
 * where x.y.z is the version from the input file.
 * @param {VersionConfig} options - The configuration options
 * @param {string} options.input - Path to the input file containing version
 * @param {string} options.output - Path for the generated output file
 * @param {object} [options.options] - Additional options (see VersionConfig)
 * @returns {Promise<string>} A promise that resolves with the extracted version
 * @throws {Error} If the input file cannot be read or doesn't contain a version field
 * @throws {Error} If the output file cannot be written
 */
export async function generateVersionFile({ input, output, options = {} }) {
  try {
    const source = JSON.parse(await fs.readFile(absolutePath(input), "utf-8"));

    if (!source.version) {
      throw new Error(`No version field found in ${input}`);
    }

    const version = source.version;

    // Generate the content using a template if provided
    let content;
    if (options.template) {
      content = options.template.replace(/{version}/g, version);
    } else {
      content = `export default "${version}";`;
      // Add named export if specified
      if (options.exportName) {
        content += `\nexport const ${options.exportName} = "${version}";`;
      }
    }

    await fs.writeFile(absolutePath(output), content);

    if (!options.silent) {
      console.log(`Version ${version} extracted and written to ${output}`);
    }

    return version;
  } catch (error) {
    if (!options.silent) {
      console.error(`Error generating version file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Converts a relative path to an absolute normalized path
 *
 * This utility function takes a relative path and:
 * 1. Resolves it against the current working directory
 * 2. Normalizes it to ensure proper platform-specific separators
 * 3. Resolves any '..' or '.' segments
 *
 * Useful for ensuring consistent path handling across different platforms.
 * @param {string} relativePath - The relative path to convert
 * @returns {string} The absolute path normalized for the current OS
 * @example
 * // On Unix systems
 * absolutePath('src/version.js') // Returns '/path/to/project/src/version.js'
 *
 * // Works with paths containing . or ..
 * absolutePath('./config/../src/version.js') // Normalizes to '/path/to/project/src/version.js'
 */
export function absolutePath(relativePath) {
  return path.normalize(path.resolve(process.cwd(), relativePath));
}

/**
 * Creates a Vite plugin that automatically generates a version file
 * during build and when the input file changes in development mode
 *
 * This plugin integrates with Vite's build process to:
 * 1. Generate the version file at the beginning of each build
 * 2. Watch for changes to the input file (e.g., package.json) during development
 * 3. Automatically regenerate the version file when the input file changes
 *
 * The plugin uses the generateVersionFile function internally and properly
 * normalizes all paths to work across different operating systems.
 * @param {VersionConfig} config - The plugin configuration
 * @param {string} config.input - Path to the input file (e.g., 'package.json')
 * @param {string} config.output - Path for the generated file (e.g., 'src/version.js')
 * @param {object} [config.options] - Additional options (see VersionConfig)
 * @returns {object} A Vite plugin object
 * @example
 * // Basic usage in vite.config.js
 * import { versionPlugin } from './tools/generate-version.js';
 * import path from 'path';
 *
 * export default defineConfig({
 *   plugins: [
 *     versionPlugin({
 *       input: 'package.json',
 *       output: path.join('src', 'version.js')
 *     })
 *   ]
 * });
 * @example
 * // Advanced usage with options
 * versionPlugin({
 *   input: 'package.json',
 *   output: path.join('src', 'version.js'),
 *   options: {
 *     silent: false,
 *     exportName: 'VERSION',
 *     template: `
 *       // Auto-generated version file
 *       export default "{version}";
 *       export const BUILD_DATE = "${new Date().toISOString()}";
 *     `
 *   }
 * })
 */
export function versionPlugin(config) {
  const input = absolutePath(config.input);
  const output = absolutePath(config.output);
  const options = config.options || {};

  return {
    name: "version-generator",
    /**
     * Called when the build starts
     * Generates the version file at the beginning of the build process
     *
     * This method is invoked by Vite at the start of both development and production builds.
     * It ensures that the version file is always up-to-date with the current version
     * from the input file (typically package.json).
     *
     * The method respects the silent option and provides appropriate console output
     * including the extracted version number for better debugging and transparency.
     * @returns {Promise<void>} A promise that resolves when the version file is generated
     */
    async buildStart() {
      if (!options.silent) {
        console.log("Generating version file...");
      }
      try {
        const version = await generateVersionFile({ input, output, options });
        if (!options.silent) {
          console.log(`[v] Version file (v${version}) generated successfully`);
        }
      } catch (error) {
        console.error("[x] Failed to generate version file:", error);
      }
    },
    /**
     * Handles hot updates in development mode
     * Regenerates the version file if the input file changes
     *
     * This method is called by Vite when any file in the project changes during development.
     * It checks if the changed file is the input file (e.g., package.json) and triggers
     * a regeneration of the version file if it is.
     * @param {object} context - Hot update context provided by Vite
     * @param {string} context.file - The absolute path of the file that was changed
     * @returns {void}
     */
    handleHotUpdate({ file }) {
      if (file === input) {
        if (!options.silent) {
          console.log(`File changed: ${file}, regenerating version file...`);
        }
        generateVersionFile({ input, output, options }).catch(console.error);
      }
    },
  };
}

/**
 * Extracts version information from various package manager files
 *
 * This function supports extracting version information from different types of
 * package configuration files including package.json, composer.json, and others.
 * It automatically detects the file type and uses the appropriate extraction method.
 * @param {string} filePath - Path to the package file
 * @param {object} [options] - Extraction options
 * @param {string} [options.versionField] - Name of the version field to extract
 * @param {string} [options.fallback] - Fallback version if extraction fails
 * @returns {Promise<{version: string, source: string}>} Version information object
 * @throws {Error} If file doesn't exist or version cannot be extracted
 * @example
 * // Extract from package.json
 * const info = await extractVersionInfo('./package.json');
 * console.log(info.version); // "1.0.0"
 * @example
 * // Extract with custom field name
 * const info = await extractVersionInfo('./composer.json', {
 *   versionField: 'version'
 * });
 * @example
 * // With fallback version
 * const info = await extractVersionInfo('./missing.json', {
 *   fallback: '0.0.1'
 * });
 * @since 1.1.0
 * @author Your Name
 * @see {@link https://semver.org/} Semantic Versioning specification
 */
export async function extractVersionInfo(filePath, options = {}) {
  const { versionField = "version", fallback } = options;

  try {
    const content = await fs.readFile(absolutePath(filePath), "utf-8");
    const data = JSON.parse(content);

    const version = data[versionField];

    if (!version) {
      if (fallback) {
        return {
          version: fallback,
          source: "fallback",
        };
      }
      throw new Error(`No ${versionField} field found in ${filePath}`);
    }

    return {
      version,
      source: filePath,
    };
  } catch (error) {
    if (fallback) {
      return {
        version: fallback,
        source: "fallback",
      };
    }
    throw new Error(
      `Failed to extract version from ${filePath}: ${error.message}`,
    );
  }
}
