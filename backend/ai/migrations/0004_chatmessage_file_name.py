from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0003_chatmessage_workout_renames'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='file_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
