
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("make-post", views.make_post, name="make-post"),
    path("posts/<str:posts_filter>/<int:page_num>", views.posts, name="posts"),
    path("post/<int:post_id>", views.post, name="post"),
    path("profile/<str:username>/<int:page_num>", views.profile, name="profile")
]
