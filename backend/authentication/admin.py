from django.contrib import admin
from .models import EmailOTP


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'otp', 'expires_at', 'attempts', 'created_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('email',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
