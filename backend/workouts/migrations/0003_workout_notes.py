from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0002_workoutexercise_parameters'),
    ]

    operations = [
        migrations.AddField(
            model_name='workout',
            name='notes',
            field=models.TextField(blank=True, null=True),
        ),
    ]