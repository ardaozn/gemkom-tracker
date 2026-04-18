from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0002_note_estimated_hours'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='is_completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='note',
            name='is_canceled',
            field=models.BooleanField(default=False),
        ),
    ]
