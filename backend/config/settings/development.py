from .base import *

DEBUG = True

# Em desenvolvimento, aceita qualquer origem para não quebrar com mudança de porta
CORS_ALLOW_ALL_ORIGINS = True

INSTALLED_APPS += ["django.contrib.admindocs"]

# Show SQL queries in development
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "django.db.backends": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "WARNING",
        },
    },
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
