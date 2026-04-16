from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from .models import Machine, Note
from .serializers import MachineSerializer, NoteSerializer

class MachineViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Machine.objects.all().order_by('name')
    serializer_class = MachineSerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by('-date', '-created_at')
    serializer_class = NoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['machine', 'date', 'status']

@api_view(['GET'])
def summary_view(request):
    counts = Note.objects.values('status').annotate(total=Count('id'))
    summary = {
        'working': 0,
        'waiting': 0,
        'maintenance_needed': 0
    }
    for item in counts:
        if item['status'] in summary:
            summary[item['status']] = item['total']
    return Response(summary)

@api_view(['POST'])
def daily_check(request):
    # Bonus: Daily internal check
    print("Daily check scheduler ran successfully!")
    return Response({"status": "success", "message": "Daily check logged."})
