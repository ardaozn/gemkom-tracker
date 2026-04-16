from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MachineViewSet, NoteViewSet, summary_view, daily_check

router = DefaultRouter()
router.register(r'machines', MachineViewSet)
router.register(r'notes', NoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', summary_view, name='summary'),
    path('internal/daily-check/', daily_check, name='daily_check'),
]
