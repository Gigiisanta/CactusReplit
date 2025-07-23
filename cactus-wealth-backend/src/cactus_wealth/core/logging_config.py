"""
Configuración de logging estructurado para Cactus Wealth Backend.

Usa structlog para generar logs en formato JSON que son fáciles de buscar
y analizar en sistemas de monitoreo de producción como ELK Stack, Datadog, etc.
"""

import logging
import os
from datetime import datetime
from typing import Any

import structlog


def configure_structured_logging(log_level: str = "INFO") -> None:
    """
    Configura el sistema de logging estructurado usando structlog.

    Args:
        log_level: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Configurar el nivel de logging
    logging.basicConfig(
        format="%(message)s", stream=None, level=getattr(logging, log_level.upper())
    )

    # Configurar structlog
    structlog.configure(
        processors=[
            # Filtros y procesadores para enriquecer logs
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            add_service_info,
            add_timestamp,
            # Procesador final para formato JSON
            structlog.processors.JSONRenderer(ensure_ascii=False),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def add_service_info(
    logger: Any, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """
    Añade información del servicio a cada log entry.

    Args:
        logger: Logger instance
        method_name: Nombre del método de logging
        event_dict: Diccionario con datos del evento

    Returns:
        Diccionario enriquecido con información del servicio
    """
    event_dict["service"] = "cactus-wealth-backend"
    event_dict["environment"] = os.getenv("ENVIRONMENT", "development")
    event_dict["version"] = "0.1.0"
    return event_dict


def add_timestamp(
    logger: Any, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """
    Añade timestamp ISO 8601 a cada log entry.

    Args:
        logger: Logger instance
        method_name: Nombre del método de logging
        event_dict: Diccionario con datos del evento

    Returns:
        Diccionario enriquecido con timestamp
    """
    event_dict["timestamp"] = datetime.utcnow().isoformat()
    return event_dict


# Logger estructurado global
def get_structured_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """
    Obtiene un logger estructurado configurado.

    Args:
        name: Nombre del logger (típicamente __name__ del módulo)

    Returns:
        Logger estructurado listo para usar
    """
    return structlog.get_logger(name)


# Ejemplos de uso de logging estructurado
def log_user_action(
    logger: structlog.stdlib.BoundLogger, user_id: int, action: str, **kwargs
) -> None:
    """
    Helper para loggear acciones de usuario con contexto estructurado.

    Args:
        logger: Logger estructurado
        user_id: ID del usuario
        action: Acción realizada
        **kwargs: Contexto adicional
    """
    logger.info("user_action", user_id=user_id, action=action, **kwargs)


def log_api_request(
    logger: structlog.stdlib.BoundLogger,
    method: str,
    path: str,
    status_code: int,
    response_time_ms: float,
    **kwargs,
) -> None:
    """
    Helper para loggear requests de API con métricas.

    Args:
        logger: Logger estructurado
        method: Método HTTP
        path: Path del endpoint
        status_code: Código de respuesta HTTP
        response_time_ms: Tiempo de respuesta en milisegundos
        **kwargs: Contexto adicional
    """
    logger.info(
        "api_request",
        http_method=method,
        http_path=path,
        http_status_code=status_code,
        response_time_ms=response_time_ms,
        **kwargs,
    )


def log_database_operation(
    logger: structlog.stdlib.BoundLogger,
    operation: str,
    table: str,
    duration_ms: float,
    **kwargs,
) -> None:
    """
    Helper para loggear operaciones de base de datos.

    Args:
        logger: Logger estructurado
        operation: Tipo de operación (SELECT, INSERT, UPDATE, DELETE)
        table: Tabla afectada
        duration_ms: Duración en milisegundos
        **kwargs: Contexto adicional
    """
    logger.info(
        "database_operation",
        db_operation=operation,
        db_table=table,
        duration_ms=duration_ms,
        **kwargs,
    )
