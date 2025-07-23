"""
Endpoints WebSocket para notificaciones en tiempo real.

Proporciona conexiones WebSocket autenticadas para notificaciones push,
actualizaciones de KPIs y comunicación bidireccional con el frontend.
"""

import json

from cactus_wealth.core.logging_config import get_structured_logger
from cactus_wealth.core.websocket_manager import connection_manager
from cactus_wealth.models import User
from cactus_wealth.security import get_current_user_from_token
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

logger = get_structured_logger(__name__)
router = APIRouter()


async def get_current_user_from_websocket(
    websocket: WebSocket, token: str
) -> User | None:
    """
    Autentica un usuario desde un WebSocket usando un token JWT.

    Args:
        websocket: Conexión WebSocket
        token: Token JWT del usuario

    Returns:
        Usuario autenticado o None si falla la autenticación
    """
    try:
        # Usar el sistema de autenticación existente
        user = await get_current_user_from_token(token)
        return user
    except Exception as e:
        logger.warning(
            "websocket_auth_failed",
            error=str(e),
            client_ip=(
                getattr(websocket.client, "host", "unknown")
                if websocket.client
                else "unknown"
            ),
        )
        return None


@router.websocket("/ws/notifications")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None, description="JWT token para autenticación"),
):
    """
    Endpoint principal de WebSocket para notificaciones en tiempo real.

    El frontend debe conectarse a este endpoint con un token JWT válido.
    Una vez conectado, recibirá notificaciones automáticamente cuando ocurran eventos relevantes.

    Ejemplo de conexión desde JavaScript:
    ```javascript
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/notifications?token=${jwtToken}`);
    ```

    Tipos de mensajes que se envían:
    - connection_established: Confirmación de conexión exitosa
    - notification: Nueva notificación para el usuario
    - kpi_update: Actualización de KPI en tiempo real
    - portfolio_snapshot_completed: Snapshot de portfolio completado
    """
    user_id = None

    try:
        # Verificar autenticación antes de aceptar conexión
        if not token:
            await websocket.close(code=4001, reason="Token de autenticación requerido")
            return

        user = await get_current_user_from_websocket(websocket, token)
        if not user:
            await websocket.close(code=4002, reason="Token de autenticación inválido")
            return

        user_id = user.id

        # Establecer conexión
        connection_success = await connection_manager.connect(websocket, user_id)
        if not connection_success:
            await websocket.close(code=4003, reason="Error al establecer conexión")
            return

        logger.info(
            "websocket_user_connected",
            user_id=user_id,
            username=user.username,
            role=user.role,
        )

        # Mantener conexión viva y manejar mensajes entrantes
        while True:
            try:
                # Esperar mensajes del cliente (para ping/pong o comandos futuros)
                message = await websocket.receive_text()
                data = json.loads(message)

                # Manejar diferentes tipos de mensajes del cliente
                await handle_client_message(data, user_id, websocket)

            except WebSocketDisconnect:
                logger.info("websocket_client_disconnected", user_id=user_id)
                break
            except json.JSONDecodeError:
                logger.warning(
                    "websocket_invalid_json",
                    user_id=user_id,
                    message=message[:100],  # Solo los primeros 100 caracteres
                )
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "error",
                            "message": "Formato de mensaje inválido. Se esperaba JSON.",
                        }
                    )
                )
            except Exception as e:
                logger.error("websocket_message_error", user_id=user_id, error=str(e))
                await websocket.send_text(
                    json.dumps(
                        {"type": "error", "message": "Error al procesar mensaje"}
                    )
                )

    except WebSocketDisconnect:
        logger.info("websocket_disconnected_during_setup", user_id=user_id)
    except Exception as e:
        logger.error("websocket_connection_error", user_id=user_id, error=str(e))
    finally:
        # Limpiar conexión
        if user_id:
            connection_manager.disconnect(websocket, user_id)


async def handle_client_message(data: dict, user_id: int, websocket: WebSocket):
    """
    Maneja mensajes entrantes del cliente WebSocket.

    Args:
        data: Datos del mensaje parseados como JSON
        user_id: ID del usuario que envió el mensaje
        websocket: Conexión WebSocket
    """
    message_type = data.get("type", "unknown")

    logger.info(
        "websocket_client_message_received", user_id=user_id, message_type=message_type
    )

    if message_type == "ping":
        # Responder a ping con pong (mantener conexión viva)
        await websocket.send_text(
            json.dumps({"type": "pong", "timestamp": data.get("timestamp")})
        )

    elif message_type == "request_connection_stats":
        # Enviar estadísticas de conexión (solo para debugging)
        stats = connection_manager.get_connection_stats()
        await websocket.send_text(
            json.dumps({"type": "connection_stats", "data": stats})
        )

    elif message_type == "request_latest_notifications":
        # El cliente solicita las últimas notificaciones
        try:
            from cactus_wealth.services import NotificationService

            notification_service = NotificationService()
            notifications = await notification_service.get_recent_notifications(
                user_id, limit=10
            )

            await websocket.send_text(
                json.dumps(
                    {
                        "type": "notification_history",
                        "data": [
                            notification.model_dump() for notification in notifications
                        ],
                    }
                )
            )
        except Exception as e:
            logger.error(f"Error fetching notifications for user {user_id}: {e}")
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "notification_history",
                        "data": [],
                        "error": "Failed to fetch notifications",
                    }
                )
            )

    else:
        # Tipo de mensaje no reconocido
        await websocket.send_text(
            json.dumps(
                {
                    "type": "error",
                    "message": f"Tipo de mensaje no reconocido: {message_type}",
                }
            )
        )


@router.get("/ws/stats")
async def get_websocket_stats(
    current_user: User = Depends(get_current_user_from_token),
):
    """
    Endpoint REST para obtener estadísticas de conexiones WebSocket.

    Solo accesible para usuarios autenticados. Útil para debugging y monitoreo.

    Returns:
        Estadísticas de conexiones WebSocket activas
    """
    stats = connection_manager.get_connection_stats()

    logger.info(
        "websocket_stats_requested",
        user_id=current_user.id,
        total_connections=stats["total_connections"],
        active_users=stats["active_users"],
    )

    return {
        "websocket_stats": stats,
        "server_status": "operational",
        "requested_by": {
            "user_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
        },
    }
