from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0002_chatmessage_workout_imports'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='workout_renames',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
