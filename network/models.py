from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.CharField(max_length=280, blank=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    users_liked = models.ManyToManyField('User', blank=True, related_name="likes")

    def __str__(self):
        if len(content) > 10:
            substring_num = 10
        else:
            substring_num = len(content)
        return f"{self.poster}: {content[0, substring_num + 1]}"

class Follow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")

    def __str__(self):
        return f"{self.user} follows {self.following}"
