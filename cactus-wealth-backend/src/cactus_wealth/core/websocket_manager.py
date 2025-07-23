"""
WebSocket Connection Manager para Cactus Wealth.

Gestiona conexiones WebSocket en tiempo real para notificaciones push,
actualizaciones de KPIs y comunicación bidireccional con el frontend.
"""

import json
from datetime import datetime
from typing import Any

from fastapi import WebSocket

from .logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class ConnectionManager:
    """
    Gestor centralizado de conexiones WebSocket.

    Mantiene un registro de todas las conexiones activas organizadas por user_id
    y proporciona métodos para enviar mensajes específicos o broadcasts.
    """

    def __init__(self):
        # Dict[user_id: int, Set[WebSocket]] - Un usuario puede tener múltiples conexiones (múltiples tabs)
        self.active_connections: dict[int, set[WebSocket]] = {}
        # Set para tracking rápido de todas las conexiones
        self._all_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int) -> bool:
        """
        Acepta una nueva conexión WebSocket y la registra para el usuario.

        Args:
            websocket: Conexión WebSocket
            user_id: ID del usuario autenticado

        Returns:
            True si la conexión fue exitosa
        """
        try:
            await websocket.accept()

            # Inicializar set para el usuario si no existe
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()

            # Agregar conexión al usuario
            self.active_connections[user_id].add(websocket)
            self._all_connections.add(websocket)

            logger.info(
                "websocket_connection_established",
                user_id=user_id,
                connection_count=len(self.active_connections[user_id]),
                total_connections=len(self._all_connections),
            )

            # Enviar mensaje de bienvenida
            await self.send_personal_message(
                {
                    "type": "connection_established",
                    "message": "Conectado al servidor de notificaciones en tiempo real",
                    "timestamp": datetime.utcnow().isoformat(),
                    "user_id": user_id,
                },
                user_id,
            )

            return True

        except Exception as e:
            logger.error("websocket_connection_failed", user_id=user_id, error=str(e))
            return False

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        """
        Desconecta un WebSocket y limpia el registro.

        Args:
            websocket: Conexión a desconectar
            user_id: ID del usuario
        """
        try:
            # Remover de conexiones del usuario
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)

                # Si el usuario no tiene más conexiones, remover completamente
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]

            # Remover de conexiones globales
            self._all_connections.discard(websocket)

            logger.info(
                "websocket_disconnected",
                user_id=user_id,
                remaining_user_connections=len(
                    self.active_connections.get(user_id, [])
                ),
                total_connections=len(self._all_connections),
            )

        except Exception as e:
            logger.error("websocket_disconnect_error", user_id=user_id, error=str(e))

    async def send_personal_message(self, message: dict[str, Any], user_id: int) -> int:
        """
        Envía un mensaje a todas las conexiones de un usuario específico.

        Args:
            message: Diccionario con el mensaje a enviar
            user_id: ID del usuario destinatario

        Returns:
            Número de conexiones a las que se envió el mensaje
        """
        if user_id not in self.active_connections:
            logger.warning("websocket_user_not_connected", user_id=user_id)
            return 0

        # Agregar metadatos al mensaje
        enriched_message = {
            **message,
            "timestamp": datetime.utcnow().isoformat(),
            "target_user_id": user_id,
        }

        message_str = json.dumps(enriched_message)
        connections_sent = 0
        failed_connections = []

        # Enviar a todas las conexiones del usuario
        for websocket in self.active_connections[
            user_id
        ].copy():  # Copy para evitar modificación durante iteración
            try:
                await websocket.send_text(message_str)
                connections_sent += 1
            except Exception as e:
                logger.warning("websocket_send_failed", user_id=user_id, error=str(e))
                failed_connections.append(websocket)

        # Limpiar conexiones fallidas
        for failed_ws in failed_connections:
            self.disconnect(failed_ws, user_id)

        if connections_sent > 0:
            logger.info(
                "websocket_message_sent",
                user_id=user_id,
                message_type=message.get("type", "unknown"),
                connections_sent=connections_sent,
                failed_connections=len(failed_connections),
            )

        return connections_sent

    async def broadcast_to_all(self, message: dict[str, Any]) -> int:
        """
        Envía un mensaje a todas las conexiones activas.

        Args:
            message: Diccionario con el mensaje a enviar

        Returns:
            Número de conexiones a las que se envió el mensaje
        """
        if not self._all_connections:
            logger.info("websocket_broadcast_no_connections")
            return 0

        # Agregar metadatos al mensaje
        enriched_message = {
            **message,
            "timestamp": datetime.utcnow().isoformat(),
            "broadcast": True,
        }

        message_str = json.dumps(enriched_message)
        connections_sent = 0
        failed_connections = []

        # Enviar a todas las conexiones
        for websocket in self._all_connections.copy():
            try:
                await websocket.send_text(message_str)
                connections_sent += 1
            except Exception as e:
                logger.warning("websocket_broadcast_send_failed", error=str(e))
                failed_connections.append(websocket)

        # Limpiar conexiones fallidas
        for failed_ws in failed_connections:
            # Buscar user_id para esta conexión (puede ser costoso, considera optimizar si es necesario)
            for user_id, user_connections in self.active_connections.items():
                if failed_ws in user_connections:
                    self.disconnect(failed_ws, user_id)
                    break

        logger.info(
            "websocket_broadcast_completed",
            message_type=message.get("type", "unknown"),
            connections_sent=connections_sent,
            failed_connections=len(failed_connections),
            total_active_users=len(self.active_connections),
        )

        return connections_sent

    def get_connection_stats(self) -> dict[str, int]:
        """
        Obtiene estadísticas de las conexiones activas.

        Returns:
            Diccionario con estadísticas de conexiones
        """
        user_connection_counts = {
            user_id: len(connections)
            for user_id, connections in self.active_connections.items()
        }

        return {
            "total_connections": len(self._all_connections),
            "active_users": len(self.active_connections),
            "user_connection_counts": user_connection_counts,
            "average_connections_per_user": (
                len(self._all_connections) / len(self.active_connections)
                if self.active_connections
                else 0
            ),
        }


# Instancia global del connection manager
connection_manager = ConnectionManager()
