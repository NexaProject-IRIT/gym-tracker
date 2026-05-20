from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0004_workoutexercise_order'),
    ]

    operations = [
        migrations.AlterField(
            model_name='workout',
            name='date',
            field=models.DateField(),
        ),
    ]
