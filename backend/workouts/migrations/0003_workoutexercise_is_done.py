from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0002_workout_notes_workoutexercise_parameters'),
    ]

    operations = [
        migrations.AddField(
            model_name='workoutexercise',
            name='is_done',
            field=models.BooleanField(default=False),
        ),
    ]
