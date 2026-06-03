from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0007_workoutexercise_sets_done'),
    ]

    operations = [
        migrations.AddField(
            model_name='workout',
            name='deleted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
