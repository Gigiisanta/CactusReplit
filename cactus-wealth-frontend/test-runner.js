#!/usr/bin/env node

/**
 * Test Runner para CactusDashboard Frontend
 * Ejecuta tests unitarios, de integración y E2E de forma automática
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestResult {
  constructor(name, status, duration, errorMessage = null, output = null) {
    this.name = name;
    this.status = status; // 'PASSED', 'FAILED', 'SKIPPED', 'ERROR'
    this.duration = duration;
    this.errorMessage = errorMessage;
    this.output = output;
  }
}

class FrontendTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.projectRoot = process.cwd();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async checkDependencies() {
    this.log('Verificando dependencias del frontend...');

    try {
      // Verificar si pnpm está instalado
      await this.runCommand('pnpm', ['--version']);

      // Verificar dependencias críticas
      const criticalDeps = ['next', 'react', 'typescript', '@types/node'];
      for (const dep of criticalDeps) {
        try {
          await this.runCommand('pnpm', ['list', dep]);
        } catch (error) {
          this.log(`Dependencia crítica faltante: ${dep}`, 'ERROR');
          return false;
        }
      }

      this.log('Todas las dependencias están instaladas', 'SUCCESS');
      return true;
    } catch (error) {
      this.log(`Error verificando dependencias: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runLinting() {
    this.log('Ejecutando linting...');
    const startTime = Date.now();

    try {
      const result = await this.runCommand('pnpm', ['lint']);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Linting',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Linting',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult('Linting', 'ERROR', duration, error.message);
    }
  }

  async runFormatting() {
    this.log('Ejecutando formateo...');
    const startTime = Date.now();

    try {
      const result = await this.runCommand('pnpm', ['format']);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Formatting',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Formatting',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult('Formatting', 'ERROR', duration, error.message);
    }
  }

  async runTypeChecking() {
    this.log('Verificando tipos...');
    const startTime = Date.now();

    try {
      const result = await this.runCommand('pnpm', ['tsc', '--noEmit']);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Type Checking',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Type Checking',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult('Type Checking', 'ERROR', duration, error.message);
    }
  }

  async runUnitTests() {
    this.log('Ejecutando tests unitarios...');
    const startTime = Date.now();

    try {
      const result = await this.runCommand('pnpm', [
        'test',
        '--passWithNoTests',
        '--watchAll=false',
      ]);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Unit Tests',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Unit Tests',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult('Unit Tests', 'ERROR', duration, error.message);
    }
  }

  async runComponentTests() {
    this.log('Ejecutando tests de componentes...');
    const startTime = Date.now();

    try {
      // Buscar archivos de test de componentes
      const testFiles = this.findTestFiles('components');
      if (testFiles.length === 0) {
        return new TestResult(
          'Component Tests',
          'SKIPPED',
          0,
          'No se encontraron tests de componentes'
        );
      }

      const result = await this.runCommand('pnpm', [
        'test',
        '--testPathPattern=components',
        '--passWithNoTests',
        '--watchAll=false',
      ]);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Component Tests',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Component Tests',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult(
        'Component Tests',
        'ERROR',
        duration,
        error.message
      );
    }
  }

  async runHookTests() {
    this.log('Ejecutando tests de hooks...');
    const startTime = Date.now();

    try {
      const testFiles = this.findTestFiles('hooks');
      if (testFiles.length === 0) {
        return new TestResult(
          'Hook Tests',
          'SKIPPED',
          0,
          'No se encontraron tests de hooks'
        );
      }

      const result = await this.runCommand('pnpm', [
        'test',
        '--testPathPattern=hooks',
        '--passWithNoTests',
        '--watchAll=false',
      ]);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Hook Tests',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Hook Tests',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult('Hook Tests', 'ERROR', duration, error.message);
    }
  }

  async runBuildTest() {
    this.log('Verificando build...');
    const startTime = Date.now();

    try {
      const result = await this.runCommand('pnpm', ['build']);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Build Test',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Build Test',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult('Build Test', 'ERROR', duration, error.message);
    }
  }

  async runAccessibilityTests() {
    this.log('Ejecutando tests de accesibilidad...');
    const startTime = Date.now();

    try {
      // Verificar si jest-axe está instalado
      try {
        await this.runCommand('pnpm', ['list', 'jest-axe']);
      } catch (error) {
        this.log(
          'jest-axe no está instalado, omitiendo tests de accesibilidad',
          'WARNING'
        );
        return new TestResult(
          'Accessibility Tests',
          'SKIPPED',
          0,
          'jest-axe no está instalado'
        );
      }

      const result = await this.runCommand('pnpm', [
        'test',
        '--testPathPattern=accessibility',
        '--passWithNoTests',
        '--watchAll=false',
      ]);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Accessibility Tests',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Accessibility Tests',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult(
        'Accessibility Tests',
        'ERROR',
        duration,
        error.message
      );
    }
  }

  async runBundleAnalysis() {
    this.log('Analizando bundle...');
    const startTime = Date.now();

    try {
      // Verificar si @next/bundle-analyzer está instalado
      try {
        await this.runCommand('pnpm', ['list', '@next/bundle-analyzer']);
      } catch (error) {
        this.log(
          '@next/bundle-analyzer no está instalado, omitiendo análisis de bundle',
          'WARNING'
        );
        return new TestResult(
          'Bundle Analysis',
          'SKIPPED',
          0,
          '@next/bundle-analyzer no está instalado'
        );
      }

      const result = await this.runCommand('pnpm', ['analyze']);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        return new TestResult(
          'Bundle Analysis',
          'PASSED',
          duration,
          null,
          result.stdout
        );
      } else {
        return new TestResult(
          'Bundle Analysis',
          'FAILED',
          duration,
          result.stderr,
          result.stdout
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return new TestResult(
        'Bundle Analysis',
        'ERROR',
        duration,
        error.message
      );
    }
  }

  findTestFiles(directory) {
    const testFiles = [];
    const searchDir = path.join(this.projectRoot, directory);

    if (!fs.existsSync(searchDir)) {
      return testFiles;
    }

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/)) {
          testFiles.push(filePath);
        }
      }
    };

    walkDir(searchDir);
    return testFiles;
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === 'PASSED').length;
    const failed = this.results.filter((r) => r.status === 'FAILED').length;
    const errors = this.results.filter((r) => r.status === 'ERROR').length;
    const skipped = this.results.filter((r) => r.status === 'SKIPPED').length;

    return {
      summary: {
        totalTests: this.results.length,
        passed,
        failed,
        errors,
        skipped,
        totalDuration,
        successRate:
          this.results.length > 0 ? (passed / this.results.length) * 100 : 0,
      },
      results: this.results.map((r) => ({
        name: r.name,
        status: r.status,
        duration: r.duration,
        errorMessage: r.errorMessage,
        output: r.output,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  saveReport(report, filename = 'frontend_test_report.json') {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    this.log(`Reporte guardado en ${filename}`);
  }

  printSummary(report) {
    const summary = report.summary;

    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE TESTS - CactusDashboard Frontend');
    console.log('='.repeat(60));
    console.log(`Total de tests: ${summary.totalTests}`);
    console.log(`✅ Pasados: ${summary.passed}`);
    console.log(`❌ Fallidos: ${summary.failed}`);
    console.log(`⚠️  Errores: ${summary.errors}`);
    console.log(`⏭️  Omitidos: ${summary.skipped}`);
    console.log(`📊 Tasa de éxito: ${summary.successRate.toFixed(1)}%`);
    console.log(
      `⏱️  Duración total: ${(summary.totalDuration / 1000).toFixed(2)}s`
    );
    console.log('='.repeat(60));

    // Mostrar detalles de tests fallidos
    const failedTests = this.results.filter((r) =>
      ['FAILED', 'ERROR'].includes(r.status)
    );
    if (failedTests.length > 0) {
      console.log('\n❌ TESTS FALLIDOS:');
      for (const test of failedTests) {
        console.log(
          `  • ${test.name}: ${test.errorMessage || 'Sin mensaje de error'}`
        );
      }
    }

    console.log();
  }

  async runAllTests() {
    this.log('🚀 Iniciando suite completa de tests del frontend...');

    // Verificar dependencias primero
    if (!(await this.checkDependencies())) {
      this.log('❌ Fallo en verificación de dependencias', 'ERROR');
      return false;
    }

    // Lista de tests a ejecutar
    const testFunctions = [
      this.runLinting,
      this.runFormatting,
      this.runTypeChecking,
      this.runUnitTests,
      this.runComponentTests,
      this.runHookTests,
      this.runBuildTest,
      this.runAccessibilityTests,
      this.runBundleAnalysis,
    ];

    // Ejecutar cada test
    for (const testFunc of testFunctions) {
      try {
        const result = await testFunc.call(this);
        this.results.push(result);

        if (result.status === 'PASSED') {
          this.log(
            `✅ ${result.name}: PASADO (${result.duration}ms)`,
            'SUCCESS'
          );
        } else if (result.status === 'SKIPPED') {
          this.log(
            `⏭️  ${result.name}: OMITIDO (${result.errorMessage})`,
            'WARNING'
          );
        } else {
          this.log(
            `❌ ${result.name}: FALLIDO (${result.duration}ms)`,
            'ERROR'
          );
          if (result.errorMessage) {
            this.log(`   Error: ${result.errorMessage}`, 'ERROR');
          }
        }
      } catch (error) {
        const errorResult = new TestResult(
          testFunc.name,
          'ERROR',
          0,
          error.message
        );
        this.results.push(errorResult);
        this.log(`💥 ${testFunc.name}: ERROR - ${error.message}`, 'ERROR');
      }
    }

    // Generar y mostrar reporte
    const report = this.generateReport();
    this.saveReport(report);
    this.printSummary(report);

    // Retornar éxito si todos los tests pasaron
    return report.summary.failed === 0 && report.summary.errors === 0;
  }
}

async function main() {
  const runner = new FrontendTestRunner();
  const success = await runner.runAllTests();

  // Exit code basado en el resultado
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = FrontendTestRunner;
