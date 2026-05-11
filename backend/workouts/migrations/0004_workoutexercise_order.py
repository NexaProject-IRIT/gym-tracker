from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0003_workoutexercise_is_done'),
    ]

    operations = [
        migrations.AddField(
            model_name='workoutexercise',
            name='order',
            field=models.IntegerField(default=0),
        ),
    ]
