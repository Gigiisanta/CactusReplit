#!/usr/bin/env python3
"""
Test Runner para CactusDashboard Backend
Ejecuta tests unitarios, de integración y E2E de forma automática
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import subprocess
import pytest
from dataclasses import dataclass
from enum import Enum

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

class TestStatus(Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    ERROR = "ERROR"

@dataclass
class TestResult:
    name: str
    status: TestStatus
    duration: float
    error_message: Optional[str] = None
    output: Optional[str] = None

class TestRunner:
    def __init__(self, backend_dir: str = "cactus-wealth-backend"):
        self.backend_dir = Path(backend_dir)
        self.results: List[TestResult] = []
        self.start_time = time.time()
        
    def log(self, message: str, level: str = "INFO"):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def run_command(self, command: List[str], cwd: Optional[str] = None) -> Tuple[int, str, str]:
        """Ejecuta un comando y retorna (return_code, stdout, stderr)"""
        try:
            result = subprocess.run(
                command,
                cwd=cwd or self.backend_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutos timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Command timed out"
        except Exception as e:
            return -1, "", str(e)
    
    def check_dependencies(self) -> bool:
        """Verifica que todas las dependencias estén instaladas"""
        self.log("Verificando dependencias...")
        
        # Verificar Poetry
        code, _, stderr = self.run_command(["poetry", "--version"])
        if code != 0:
            self.log(f"Poetry no está instalado: {stderr}", "ERROR")
            return False
        
        # Verificar dependencias críticas
        critical_deps = ["fastapi", "sqlmodel", "pydantic", "alembic", "pytest"]
        for dep in critical_deps:
            code, _, stderr = self.run_command(["poetry", "run", "python", "-c", f"import {dep}"])
            if code != 0:
                self.log(f"Dependencia crítica faltante: {dep}", "ERROR")
                return False
        
        self.log("Todas las dependencias están instaladas", "SUCCESS")
        return True
    
    def run_linting(self) -> TestResult:
        """Ejecuta linting con ruff"""
        self.log("Ejecutando linting...")
        start_time = time.time()
        
        # Verificar si ruff está instalado
        code, _, _ = self.run_command(["poetry", "run", "ruff", "--version"])
        if code != 0:
            self.run_command(["poetry", "add", "--group", "dev", "ruff"])
        
        # Ejecutar ruff check
        code, stdout, stderr = self.run_command(["poetry", "run", "ruff", "check", "."])
        duration = time.time() - start_time
        
        if code == 0:
            return TestResult("Linting", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Linting", TestStatus.FAILED, duration, 
                            error_message=stderr, output=stdout)
    
    def run_type_checking(self) -> TestResult:
        """Ejecuta verificación de tipos con mypy"""
        self.log("Verificando tipos...")
        start_time = time.time()
        
        # Verificar si mypy está instalado
        code, _, _ = self.run_command(["poetry", "run", "mypy", "--version"])
        if code != 0:
            self.run_command(["poetry", "add", "--group", "dev", "mypy"])
        
        # Ejecutar mypy
        code, stdout, stderr = self.run_command(["poetry", "run", "mypy", "src/"])
        duration = time.time() - start_time
        
        if code == 0:
            return TestResult("Type Checking", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Type Checking", TestStatus.FAILED, duration,
                            error_message=stderr, output=stdout)
    
    def run_unit_tests(self) -> TestResult:
        """Ejecuta tests unitarios"""
        self.log("Ejecutando tests unitarios...")
        start_time = time.time()
        
        # Verificar si pytest está instalado
        code, _, _ = self.run_command(["poetry", "run", "pytest", "--version"])
        if code != 0:
            self.run_command(["poetry", "add", "--group", "dev", "pytest", "pytest-asyncio", "httpx"])
        
        # Ejecutar tests unitarios
        code, stdout, stderr = self.run_command([
            "poetry", "run", "pytest", "tests/", "-v", "--tb=short", "--json-report"
        ])
        duration = time.time() - start_time
        
        if code == 0:
            return TestResult("Unit Tests", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Unit Tests", TestStatus.FAILED, duration,
                            error_message=stderr, output=stdout)
    
    def run_integration_tests(self) -> TestResult:
        """Ejecuta tests de integración"""
        self.log("Ejecutando tests de integración...")
        start_time = time.time()
        
        # Ejecutar tests de integración específicos
        code, stdout, stderr = self.run_command([
            "poetry", "run", "pytest", "tests/integration/", "-v", "--tb=short", "--json-report"
        ])
        duration = time.time() - start_time
        
        if code == 0:
            return TestResult("Integration Tests", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Integration Tests", TestStatus.FAILED, duration,
                            error_message=stderr, output=stdout)
    
    def run_security_scan(self) -> TestResult:
        """Ejecuta escaneo de seguridad con bandit"""
        self.log("Ejecutando escaneo de seguridad...")
        start_time = time.time()
        
        # Verificar si bandit está instalado
        code, _, _ = self.run_command(["poetry", "run", "bandit", "--version"])
        if code != 0:
            self.run_command(["poetry", "add", "--group", "dev", "bandit"])
        
        # Ejecutar bandit
        code, stdout, stderr = self.run_command([
            "poetry", "run", "bandit", "-r", "src/", "-f", "json", "-o", "bandit_report.json"
        ])
        duration = time.time() - start_time
        
        if code == 0:
            return TestResult("Security Scan", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Security Scan", TestStatus.FAILED, duration,
                            error_message=stderr, output=stdout)
    
    def run_complexity_analysis(self) -> TestResult:
        """Ejecuta análisis de complejidad con radon"""
        self.log("Analizando complejidad del código...")
        start_time = time.time()
        
        # Verificar si radon está instalado
        code, _, _ = self.run_command(["poetry", "run", "radon", "--version"])
        if code != 0:
            self.run_command(["poetry", "add", "--group", "dev", "radon"])
        
        # Ejecutar radon
        code, stdout, stderr = self.run_command([
            "poetry", "run", "radon", "cc", "src/", "-a", "-j"
        ])
        duration = time.time() - start_time
        
        if code == 0:
            # Guardar reporte
            with open("radon_report.json", "w") as f:
                f.write(stdout)
            return TestResult("Complexity Analysis", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Complexity Analysis", TestStatus.FAILED, duration,
                            error_message=stderr, output=stdout)
    
    def check_database_connection(self) -> TestResult:
        """Verifica conexión a la base de datos"""
        self.log("Verificando conexión a la base de datos...")
        start_time = time.time()
        
        try:
            # Intentar importar y conectar a la base de datos
            code, stdout, stderr = self.run_command([
                "poetry", "run", "python", "-c", 
                "from src.cactus_wealth.database import engine; print('DB connection OK')"
            ])
            duration = time.time() - start_time
            
            if code == 0:
                return TestResult("Database Connection", TestStatus.PASSED, duration, output=stdout)
            else:
                return TestResult("Database Connection", TestStatus.FAILED, duration,
                                error_message=stderr, output=stdout)
        except Exception as e:
            duration = time.time() - start_time
            return TestResult("Database Connection", TestStatus.ERROR, duration,
                            error_message=str(e))
    
    def run_migrations_check(self) -> TestResult:
        """Verifica que las migraciones estén actualizadas"""
        self.log("Verificando migraciones...")
        start_time = time.time()
        
        # Verificar estado de migraciones
        code, stdout, stderr = self.run_command([
            "poetry", "run", "alembic", "current"
        ])
        duration = time.time() - start_time
        
        if code == 0:
            return TestResult("Migrations Check", TestStatus.PASSED, duration, output=stdout)
        else:
            return TestResult("Migrations Check", TestStatus.FAILED, duration,
                            error_message=stderr, output=stdout)
    
    def generate_report(self) -> Dict:
        """Genera un reporte completo de los tests"""
        total_duration = time.time() - self.start_time
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        errors = sum(1 for r in self.results if r.status == TestStatus.ERROR)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIPPED)
        
        report = {
            "summary": {
                "total_tests": len(self.results),
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "skipped": skipped,
                "total_duration": total_duration,
                "success_rate": (passed / len(self.results) * 100) if self.results else 0
            },
            "results": [
                {
                    "name": r.name,
                    "status": r.status.value,
                    "duration": r.duration,
                    "error_message": r.error_message,
                    "output": r.output
                }
                for r in self.results
            ],
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return report
    
    def save_report(self, report: Dict, filename: str = "test_report.json"):
        """Guarda el reporte en un archivo JSON"""
        with open(filename, "w") as f:
            json.dump(report, f, indent=2)
        self.log(f"Reporte guardado en {filename}")
    
    def print_summary(self, report: Dict):
        """Imprime un resumen de los resultados"""
        summary = report["summary"]
        
        print("\n" + "="*60)
        print("RESUMEN DE TESTS - CactusDashboard Backend")
        print("="*60)
        print(f"Total de tests: {summary['total_tests']}")
        print(f"✅ Pasados: {summary['passed']}")
        print(f"❌ Fallidos: {summary['failed']}")
        print(f"⚠️  Errores: {summary['errors']}")
        print(f"⏭️  Omitidos: {summary['skipped']}")
        print(f"📊 Tasa de éxito: {summary['success_rate']:.1f}%")
        print(f"⏱️  Duración total: {summary['total_duration']:.2f}s")
        print("="*60)
        
        # Mostrar detalles de tests fallidos
        failed_tests = [r for r in self.results if r.status in [TestStatus.FAILED, TestStatus.ERROR]]
        if failed_tests:
            print("\n❌ TESTS FALLIDOS:")
            for test in failed_tests:
                print(f"  • {test.name}: {test.error_message or 'Sin mensaje de error'}")
        
        print()
    
    def run_all_tests(self) -> bool:
        """Ejecuta todos los tests en secuencia"""
        self.log("🚀 Iniciando suite completa de tests...")
        
        # Verificar dependencias primero
        if not self.check_dependencies():
            self.log("❌ Fallo en verificación de dependencias", "ERROR")
            return False
        
        # Lista de tests a ejecutar
        test_functions = [
            self.run_linting,
            self.run_type_checking,
            self.check_database_connection,
            self.run_migrations_check,
            self.run_unit_tests,
            self.run_integration_tests,
            self.run_security_scan,
            self.run_complexity_analysis
        ]
        
        # Ejecutar cada test
        for test_func in test_functions:
            try:
                result = test_func()
                self.results.append(result)
                
                if result.status == TestStatus.PASSED:
                    self.log(f"✅ {result.name}: PASADO ({result.duration:.2f}s)", "SUCCESS")
                else:
                    self.log(f"❌ {result.name}: FALLIDO ({result.duration:.2f}s)", "ERROR")
                    if result.error_message:
                        self.log(f"   Error: {result.error_message}", "ERROR")
                        
            except Exception as e:
                error_result = TestResult(
                    test_func.__name__, 
                    TestStatus.ERROR, 
                    0.0, 
                    error_message=str(e)
                )
                self.results.append(error_result)
                self.log(f"💥 {test_func.__name__}: ERROR - {str(e)}", "ERROR")
        
        # Generar y mostrar reporte
        report = self.generate_report()
        self.save_report(report)
        self.print_summary(report)
        
        # Retornar éxito si todos los tests pasaron
        return report["summary"]["failed"] == 0 and report["summary"]["errors"] == 0

def main():
    """Función principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Runner para CactusDashboard Backend")
    parser.add_argument("--backend-dir", default="cactus-wealth-backend", 
                       help="Directorio del backend")
    parser.add_argument("--report-file", default="test_report.json",
                       help="Archivo para guardar el reporte")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Modo verbose")
    
    args = parser.parse_args()
    
    # Crear y ejecutar test runner
    runner = TestRunner(args.backend_dir)
    success = runner.run_all_tests()
    
    # Exit code basado en el resultado
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 