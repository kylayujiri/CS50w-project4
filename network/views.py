import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator

from .models import User, Post, Follow


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@csrf_exempt
@login_required
def make_post(request):

    # Making a post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # get the data from the form (sent as json)
    data = json.loads(request.body)
    post_content = data.get("content")

    # add the post to the database
    new_post = Post(
        poster=request.user,
        content=post_content,
    )
    new_post.save()

    # return a success message
    return JsonResponse({"message": "Post created successfully."}, status=201)


def posts(request, posts_filter, page_num):
    # posts_filter tells us what posts we want
    # page_num tells us what page of those posts we want to display
    # (default from index.js is 1)

    # determrine what posts we're getting (all or following?)
    if posts_filter == "all":
        posts = Post.objects.all()
    elif posts_filter == "following":
        # for following posts, a user needs to be signed in
        if request.user.is_authenticated:
            # posts where the poster is followed by request.user
            posts = Post.objects.filter(poster__followers__user=request.user)
        else:
            return JsonResponse({"error": "User is not signed in"}, status=400)
    else:
        return JsonResponse({"error": "Invalid posts filter"}, status=400)

    # order pages (latest first)
    posts = posts.order_by("-timestamp").all()

    # paginate posts (10 posts per page)
    post_paginator = Paginator(posts, 10)

    # get the number of pages
    num_pages = post_paginator.num_pages

    # get the page reference from page_num
    current_page = post_paginator.page(page_num)

    # format posts we want to return (similar code in profile view)

    posts_array = []
    posts_dict = {}

    # for each post on the page we're displaying
    for post in current_page.object_list:

        # determine if the user is the poster or if they liked the post

        user_is_poster = False
        user_liked = False

        if request.user.is_authenticated:

            if post.poster == request.user:
                user_is_poster = True
            else:
                user_is_poster = False

            try:
                post.users_liked.get(pk=request.user.pk)
                user_liked = True
            except User.DoesNotExist:
                user_liked = False

        # this is the post format we return
        temp_post = {
            'post_id': post.pk,
            'poster': post.poster.username,
            'content': post.content,
            'timestamp': post.timestamp.strftime("%-m/%-d/%y %-I:%M %p"),
            'like_count': post.users_liked.count(),
            'user_liked': user_liked,
            'user_is_poster': user_is_poster
        }

        # add the post to the posts_array
        posts_array.append(temp_post)

    #we want to return a json dict, so we add the posts_array with some other variables
    posts_dict["posts"] = posts_array
    posts_dict["num_pages"] = num_pages
    posts_dict["current_page"] = page_num

    # return the dict
    return JsonResponse(posts_dict)


@login_required
@csrf_exempt
def post(request, post_id):
    # post_id is the id of the post we're altering (like or edit)

    # query for the requested post
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

    if request.method == "PUT":
        data = json.loads(request.body)

        # if the user is liking/unliking
        like_status = data.get("like")
        if like_status is not None:
            if like_status:
                # the user liked the post
                post.users_liked.add(request.user)
            else:
                # the user is unliking the post
                post.users_liked.remove(request.user)

            response = {
                "like_count": post.users_liked.count()
            }

            post.save()
            return JsonResponse(response)

        # if the user is editing
        edit_status = data.get("edit")
        if edit_status is not None:
            if request.user == post.poster:
                post.content = edit_status

                post.save()

                return JsonResponse({"message": "Changes to post saved."}, status=201)
            else:
                return JsonResponse({"error": "User cannot edit other user's posts."}, status=400)

        return JsonResponse({"error": "Nothing was changed."}, status=400)

    else:
        # request method must be PUT
        return JsonResponse({"error": "PUT request required."}, status=400)


@csrf_exempt
def profile(request, username, page_num):
    # username gives us the username of the user we're viewing
    # page_num gives us the page of the user's posts we would like to view

    # query for the user
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    # if we're just viewing the profile, method is GET
    if request.method == "GET":

        # get user's posts (similar code in posts view)
        posts = Post.objects.filter(poster=user).order_by("-timestamp").all()

        # pagination of the user's posts
        post_paginator = Paginator(posts, 10)
        num_pages = post_paginator.num_pages

        # get page we're viewing
        current_page = post_paginator.page(page_num)

        # format posts to return
        posts_array = []

        # for each post in the page
        for post in current_page.object_list:

            # check if the user made the post or if they liked it
            user_is_poster = False
            user_liked = False

            if request.user.is_authenticated:

                if post.poster == request.user:
                    user_is_poster = True
                else:
                    user_is_poster = False

                try:
                    post.users_liked.get(pk=request.user.pk)
                    user_liked = True
                except User.DoesNotExist:
                    user_liked = False

            # this is the format in which we return the post
            temp_post = {
                'post_id': post.pk,
                'poster': post.poster.username,
                'content': post.content,
                'timestamp': post.timestamp.strftime("%-m/%-d/%y %-I:%M %p"),
                'like_count': post.users_liked.count(),
                'user_liked': user_liked,
                'user_is_poster': user_is_poster
            }

            # add the post to the posts_array
            posts_array.append(temp_post)

        # determine if this is the profile of the signed in user
        # or if the signed in user is following this user

        is_signed_in_user = False;
        user_is_following = False;

        if request.user.is_authenticated:

            try:
                user.followers.get(user=request.user)
                user_is_following = True
            except Follow.DoesNotExist:
                user_is_following = False

            if request.user == user:
                is_signed_in_user = True

        # return user info
        user_info = {
            'username': user.username,
            'date_joined': user.date_joined.strftime("%B %Y"),
            'num_followers': user.followers.count(),
            'num_following': user.following.count(),
            'is_signed_in_user': is_signed_in_user,
            'user_is_following': user_is_following,
            'user_posts': posts_array,
            'num_pages': num_pages,
            'current_page': page_num
        }

        return JsonResponse(user_info)


    # method is POST if the signed in user follows/unfollows the viewed user
    elif request.method == "POST":

        # make sure there is a user signed in to do the following/unfollowing
        if request.user.is_authenticated:

            data = json.loads(request.body)

            follow_status = data.get("follow")

            if follow_status:
                # request.user is following user

                # add the follow to the database
                new_follow = Follow(
                    user=request.user,
                    following=user
                )

                new_follow.save()

            else:
                # request.user is unfollowing user

                # remove the follow from the database
                user.followers.filter(user=request.user, following=user).delete()

            response = {
                "follower_count": user.followers.count()
            }

            return JsonResponse(response)

        else:

            return JsonResponse({"error": "You need to be signed in to follow."}, status=400)

    # Email must be via GET or POST
    else:
        return JsonResponse({"error": "GET or POST request required."}, status=400)
