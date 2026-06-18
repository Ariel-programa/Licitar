import logging
from celery import shared_task
from django.db.models import Q

logger = logging.getLogger(__name__)


@shared_task
def procesar_alertas():
    from apps.alertas.models import Alerta, NotificacionEnviada
    from apps.licitaciones.models import Licitacion
    from django.core.mail import send_mail
    from django.conf import settings

    alertas = Alerta.objects.filter(activa=True, canal="email").select_related("usuario")

    for alerta in alertas:
        if not alerta.usuario.email:
            continue

        palabras = [p.strip() for p in alerta.palabras_clave.split("\n") if p.strip()]
        if not palabras:
            continue

        q = Q()
        for palabra in palabras:
            q |= Q(titulo__icontains=palabra) | Q(descripcion__icontains=palabra)

        qs = Licitacion.objects.filter(q)
        if alerta.provincia:
            qs = qs.filter(provincia=alerta.provincia)
        if alerta.rubro:
            qs = qs.filter(rubro__icontains=alerta.rubro)

        ya_notificadas = NotificacionEnviada.objects.filter(
            alerta=alerta
        ).values_list("licitacion_id", flat=True)

        nuevas = list(qs.exclude(id__in=ya_notificadas)[:20])

        if not nuevas:
            continue

        items_text = "\n".join([
            f"  • {l.titulo[:80]} — {l.organismo} ({l.estado})"
            for l in nuevas
        ])

        cantidad = len(nuevas)
        plural = cantidad > 1
        subject = (
            f"[LicitAR] {cantidad} licitación{'es' if plural else ''} "
            f"nueva{'s' if plural else ''}: {alerta.nombre}"
        )
        body = (
            f"Hola,\n\n"
            f"Encontramos {cantidad} licitación{'es' if plural else ''} que "
            f"coincide{'n' if plural else ''} con tu alerta \"{alerta.nombre}\":\n\n"
            f"{items_text}\n\n"
            f"Ingresá a LicitAR para ver los detalles completos.\n\n"
            f"---\n"
            f"Este email fue enviado automáticamente por LicitAR.\n"
            f"Para dejar de recibirlo, desactivá la alerta en la plataforma."
        )

        exitosa = True
        error_msg = ""
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alerta.usuario.email],
                fail_silently=False,
            )
            logger.info(
                f"Email enviado a {alerta.usuario.email} "
                f"para alerta '{alerta.nombre}' ({cantidad} licitaciones)"
            )
        except Exception as exc:
            exitosa = False
            error_msg = str(exc)
            logger.error(f"Error enviando email a {alerta.usuario.email}: {exc}")

        for l in nuevas:
            NotificacionEnviada.objects.get_or_create(
                alerta=alerta,
                licitacion_id=l.id,
                defaults={"canal": "email", "exitosa": exitosa, "error": error_msg},
            )
