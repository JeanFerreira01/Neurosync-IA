from .models import AuditLog

AUDITED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.method in AUDITED_METHODS and hasattr(request, "user") and request.user.is_authenticated:
            AuditLog.objects.create(
                user=request.user,
                clinic=getattr(request.user, "clinic", None),
                action=request.method,
                resource=request.path,
                ip_address=self._get_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
        return response

    def _get_ip(self, request):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
