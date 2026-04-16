from rest_framework import serializers
from .models import Machine, Note

class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = '__all__'

class NoteSerializer(serializers.ModelSerializer):
    machine_details = MachineSerializer(source='machine', read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'machine', 'machine_details', 'date', 'status', 'description', 'lost_hours', 'created_at']
