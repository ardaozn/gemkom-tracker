from django.db import models

class Machine(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class Note(models.Model):
    STATUS_CHOICES = (
        ('working', 'Çalışıyor'),
        ('waiting', 'Beklemede'),
        ('maintenance_needed', 'Bakım Gerekli'),
    )
    
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='notes')
    date = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    description = models.TextField()
    lost_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    is_canceled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.machine.name} - {self.date} - {self.status}"
