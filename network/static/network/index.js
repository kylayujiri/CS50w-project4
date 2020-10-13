document.addEventListener('DOMContentLoaded', () => {

  // Use buttons to toggle between views
  // (Have to check if they exist in the case that no user is logged in)

  // Profile Link
  if (document.querySelector('#profile-nav') != null) {
    document.querySelector('#profile-nav').onclick = () => {
      loadProfileView(document.querySelector('#profile-nav').innerText, 1);
      return false;
    };
  }

  // Following Link
  if (document.querySelector('#following-nav') != null) {
    document.querySelector('#following-nav').onclick = () => {
      loadPostsView('following', 1);
      return false;
    };
  }

  // By default, load first page of all posts
  loadPostsView('all', 1);

});


function loadPostsView(postsFilter, pageNum) {
  // Loads the page (given by pageNum) of the posts
  // (following or all; given by postsFilter)

  // Show posts-view; Hide profile-view
  document.querySelector('#posts-view').style.display = 'block';
  document.querySelector('#profile-view').style.display = 'none';

  // clear all nav bar items of the active state
  if (document.querySelector('#profile-nav') != null) {
    document.querySelector('#profile-nav').closest(".nav-item").classList.remove("active");
  }

  document.querySelector('#all-posts-nav').closest(".nav-item").classList.remove("active");

  if (document.querySelector('#following-nav') != null) {
    document.querySelector('#following-nav').closest(".nav-item").classList.remove("active");
  }

  // clear user-posts element and posts element
  const userPosts = document.querySelector('#user-posts');
  while (userPosts.hasChildNodes()) {
    userPosts.removeChild(userPosts.firstChild);
  }

  const postsElement = document.querySelector('#posts');
  while (postsElement.hasChildNodes()) {
    postsElement.removeChild(postsElement.firstChild);
  }

  // determine and display title (All Posts or Following) and nav bar active state
  let title = "";

  if (postsFilter === "all") {
    title = "All Posts"
    document.querySelector('#all-posts-nav').closest(".nav-item").classList.add("active");
  } else if (postsFilter === "following") {
    title = "Posts from Following"
    document.querySelector('#following-nav').closest(".nav-item").classList.add("active");
  }

  document.querySelector('#posts-title').innerHTML = `<h3>${title}</h3>`;

  // add onclick event listener to the make post button
  if (document.querySelector('#make-post-button') != null) {
    document.querySelector('#make-post-button').onclick = () => modalFunctionality();
  }

  // get the page of posts and display them using fetch
  fetch(`/posts/${postsFilter}/${pageNum}`)
  .then(response => response.json())
  .then(result => {
    // print posts to console
    console.log(result)

    // call displayPost for each post
    result.posts.forEach(postInfo => displayPost(postInfo, postsFilter));

    // add functioinality to the previous and next buttons
    paginationFunctionality(result, postsFilter);

  });

}


function modalFunctionality() {
  // called when the make post button is pressed

  // clear out the form field
  document.querySelector('#post-text').value = '';

  // show the modal
  $("#post-modal").modal("show");

  // if the user presses cancel, close the modal
  document.querySelector('#cancel-modal').onclick = () => {
    $("#post-modal").modal("hide");
  }

  // if the user presses post, make the post and close the modal
  document.querySelector('#make-post-form').onsubmit = event => {
    event.preventDefault();

    const formText = document.querySelector('#post-text');

    // fetch / api
    fetch('/make-post', {
      method: 'POST',
      body: JSON.stringify({
        content: formText.value
      })
    })
    .then(response => response.json())
    .then(result => {
      // print result
      console.log(result);

      // close modal
      $("#post-modal").modal("hide");

      // load the first page of posts-view (so we see the post we made!)
      loadPostsView('all', 1);
    });
  }
}


function loadProfileView(username, pageNum) {
  // loads the profile (user info and their posts) of the provided user

  // Show profile-view, hide posts-view
  document.querySelector('#posts-view').style.display = 'none';
  document.querySelector('#profile-view').style.display = 'block';

  // set profile-nav to active if user is view their own profile
  if (document.querySelector('#profile-nav') != null && document.querySelector('#profile-nav').innerText == username) {
    document.querySelector('#profile-nav').closest(".nav-item").classList.add("active");
  }

  // all else remove active
  document.querySelector('#all-posts-nav').closest(".nav-item").classList.remove("active");
  if (document.querySelector('#following-nav') != null) {
    document.querySelector('#following-nav').closest(".nav-item").classList.remove("active");
  }

  // clear user posts element, posts element, user info element
  const userPosts = document.querySelector('#user-posts');
  while (userPosts.hasChildNodes()) {
    userPosts.removeChild(userPosts.firstChild);
  }

  const postsElement = document.querySelector('#posts');
  while (postsElement.hasChildNodes()) {
    postsElement.removeChild(postsElement.firstChild);
  }

  const userInfoElement = document.querySelector('#user-info');
  while (userInfoElement.hasChildNodes()) {
    userInfoElement.removeChild(userInfoElement.firstChild);
  }

  // fetch user info
  fetch(`/profile/${username}/${pageNum}`)
  .then(response => response.json())
  .then(userInfo => {
    // print user info
    console.log(userInfo);

    // display in DOM

    // get the element for user info
    userInfoDiv = document.querySelector('#user-info');

    // create element for the username
    const usernameTitle = document.createElement('h2');
    usernameTitle.innerHTML = userInfo.username;

    // create button for follow/unfollow
    const followButton = document.createElement('button');
    followButton.className = "btn btn-sm mb-2";

    if (userInfo.user_is_following) {
      followButton.innerHTML = "Unfollow";
      followButton.classList.add("btn-primary");
    } else {
      followButton.innerHTML = "Follow"
      followButton.classList.add("btn-outline-primary");
    }

    // determine if we show the follow/unfollow button
    // show if the signed in user is viewing a different account
    // don't show if user not signed in or it is their own account
    if (userInfo.is_signed_in_user || document.querySelector('#following-nav') == null) {
      followButton.style.display = 'none';
    } else {
      followButton.style.display = 'inline-block';
    }

    // create divs for additionall info
    const otherInfo = document.createElement('div');

    // create divs for content within the otherInfo div
    const joinedDate = document.createElement('p');
    joinedDate.innerHTML = `Joined ${userInfo.date_joined}`;

    const numFollowers = document.createElement('p');
    numFollowers.innerHTML = `<strong>${userInfo.num_followers}</strong> Follower(s)`;

    const numFollowing = document.createElement('p');
    numFollowing.innerHTML = `<strong>${userInfo.num_following}</strong> Following`;

    // create header for posts
    const postsHeader = document.createElement('h3');
    postsHeader.innerHTML = "Posts";

    // append everything to their respective parents
    otherInfo.append(joinedDate);
    otherInfo.append(numFollowers);
    otherInfo.append(numFollowing);
    otherInfo.append(postsHeader);

    userInfoDiv.append(usernameTitle);
    userInfoDiv.append(followButton);
    userInfoDiv.append(otherInfo);

    // add onclick event listener to the follow/unfollow button
    followButton.onclick = event => {
      event.preventDefault();

      // send the data via POST
      fetch(`/profile/${userInfo.username}/${pageNum}`, {
        method: 'POST',
        body: JSON.stringify({
          follow: !userInfo.user_is_following
        })
      })
      .then(response => response.json())
      .then(result => {
        // print result
        console.log(result);

        // update our variables
        userInfo.user_is_following = !userInfo.user_is_following;
        userInfo.num_followers = result.follower_count;

        // change the button's display
        if (userInfo.user_is_following) {
          followButton.innerHTML = "Unfollow";
          followButton.classList.add("btn-primary");
          followButton.classList.remove("btn-outline-primary");
        } else {
          followButton.innerHTML = "Follow"
          followButton.classList.add("btn-outline-primary");
          followButton.classList.remove("btn-primary");
        }

        // update the follower count
        userInfoDiv.childNodes[2].childNodes[1].innerHTML = `<strong>${userInfo.num_followers}</strong> Follower(s)`;

      });

    }; // end of event listener for follow button

    // display the user's posts
    userInfo.user_posts.forEach(postInfo => displayPost(postInfo, "profile"));

    // info to send to the paginator function
    result = {
      "num_pages": userInfo.num_pages,
      "current_page": userInfo.current_page
    }

    // add functionality for the prev/next buttons
    paginationFunctionality(result, "profile", username)

  }); // end of .then for GET fetch

} // end of loadProfileView


function displayPost(postInfo, postsFilter) {
  // displays one post (called for each post from a fetch)

  // determine where to display the post
  if (postsFilter === "profile") {
    postsDiv = document.querySelector('#user-posts');
  } else { // postsFilter is "all" or "following"
    postsDiv = document.querySelector('#posts');
  }

  // create the overall div for the post (a list item)
  const post = document.createElement('div');
  post.className = 'list-group-item m-2';
  post.id = `post-${postInfo.post_id}`

  // create a div for the top part of the post (poster's username and edit button)
  const postHeader = document.createElement('div');
  postHeader.className = 'd-flex w-100';

  // create the username (with link to profile page)
  const postUsername = document.createElement('a');
  postUsername.innerHTML = postInfo.poster;
  postUsername.className = 'h5';
  postUsername.onclick = event => {
    event.preventDefault();

    loadProfileView(postInfo.poster, 1);
  };

  // add the username to the post header
  postHeader.append(postUsername);

  // create the edit button
  const editButton = document.createElement('button');
  editButton.innerHTML = "Edit";
  editButton.className = "btn btn-outline-primary btn-sm";
  editButton.onclick = event => {
    event.preventDefault();

    editPost(postInfo.post_id);

  };
  postHeader.append(editButton);

  // determine if the edit button should show
  // (aka when the signed in user is the poster)
  if (postInfo.user_is_poster) { // edit button should show
    editButton.style.display = 'inline';
    postHeader.classList.add("justify-content-between");
  } else { // edit button should not show
    editButton.style.display = 'none';
  }

  // add the header to the post div
  post.append(postHeader);

  // create the post text
  const postText = document.createElement('div');
  postText.innerText = postInfo.content;

  // for aesthetic reasons
  // if #following-nav exists, then a user is signed in
  // therefore, the like button is displayed, so we add extra space
  // (may not be the best way to do this?)
  if (document.querySelector('#following-nav') != null) {
    postText.className = 'pb-2'
  }

  // add the post text to the post
  post.append(postText);

  // now create the post footer (like button, like count, timestamp)
  const postFooter = document.createElement('div');
  postFooter.className = 'd-flex w-100 align-items-center';

  const likeButton = document.createElement('button');
  likeButton.className = "btn btn-sm";

  // determines the button appearance
  if (postInfo.user_liked) {
    likeButton.classList.add("btn-danger")
    likeButton.innerHTML = "Unlike";
  } else {
    likeButton.classList.add("btn-outline-danger")
    likeButton.innerHTML = "Like";
  }

  // add the button to the footer
  postFooter.append(likeButton);

  // check if user signed in using #following-nav again
  // if user is signed in, like button should display
  if (document.querySelector('#following-nav') != null) {
    likeButton.style.display = 'inline-block';
  } else {
    likeButton.style.display = 'none';
  }

  // create an element for like count
  const likeCount = document.createElement('div');
  likeCount.innerHTML = `${postInfo.like_count} Like(s)`;

  // if user is signed in, add padding around the like count
  // (to give it space from the like button)
  if (document.querySelector('#following-nav') != null) {
    likeCount.className = 'p-2';
  }

  // add the like count to the footer
  postFooter.append(likeCount);

  // create the timestamp
  const timestamp = document.createElement('div');
  timestamp.className = 'ml-auto p-2'; // we want it on the right side
  timestamp.innerHTML = postInfo.timestamp;

  // add the timestamp to the footer
  postFooter.append(timestamp);

  // add the footer to the post
  post.append(postFooter);

  // add the post to the postsDiv (#user-posts or #posts)
  postsDiv.append(post);

  // add the onclick event if the likebutton is displayed (user is signed in)
  if (likeButton.style.display != 'none') {

    likeButton.onclick = event => {
      event.preventDefault();

      // use PUT method to add/remove a like from this user
      fetch(`/post/${postInfo.post_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          like: !postInfo.user_liked
        })
      })
      .then(response => response.json())
      .then(result => {
        console.log(result);

        // update postInfo variables
        postInfo.user_liked = !postInfo.user_liked;
        postInfo.like_count = result.like_count;

        // remove all elements from footer so we can replace them
        while (postFooter.hasChildNodes()) {
          postFooter.removeChild(postFooter.firstChild);
        }

        // change the like button's appearance
        if (postInfo.user_liked) {
          likeButton.classList.remove("btn-outline-danger")
          likeButton.classList.add("btn-danger")
          likeButton.innerHTML = "Unlike";
        } else {
          likeButton.classList.remove("btn-danger")
          likeButton.classList.add("btn-outline-danger")
          likeButton.innerHTML = "Like";
        }

        // add the like button back to the footer
        postFooter.append(likeButton);

        // update like count and add back to the footer
        likeCount.innerHTML = `${postInfo.like_count} Like(s)`;
        postFooter.append(likeCount);

        // add the timestamp back to the footer
        postFooter.append(timestamp);

      }); // end of .then for like PUT fetch

    }; // end of onclick for like button
  }

} // end of displayPost


function editPost(postId) {
  // edit button has been pressed, so we need to display the edit template

  // get the id we added to each post in displayPost
  postDiv = document.querySelector(`#post-${postId}`);

  // get references to all the post's elements
  postHeader = postDiv.childNodes[0];
  postText = postDiv.childNodes[1];
  postFooter = postDiv.childNodes[2];

  postUsername = postHeader.childNodes[0];
  postEditButton = postHeader.childNodes[1]; // edit button must exist if we're editing

  postLikeButton = postFooter.childNodes[0];
  postLikeCount = postFooter.childNodes[1];
  postTimestamp = postFooter.childNodes[2];

  // hide username and edit button
  postUsername.style.display = 'none';
  postEditButton.style.display = 'none';

  // display "Edit Post" in postHeader
  const editTitle = document.createElement('h5');
  editTitle.innerHTML = "Edit Post";
  postHeader.append(editTitle);

  // replace postText with a textarea (prefilled with old post text)
  oldText = postText.innerHTML;
  postText.innerHTML = "";
  const editTextArea = document.createElement('textarea');
  editTextArea.className = "form-control";
  editTextArea.value = oldText;
  postText.append(editTextArea);

  // hide like button, like count, and timestamp
  postLikeButton.style.display = 'none';
  postLikeCount.style.display = 'none';
  postTimestamp.style.display = 'none';

  // add justify-content-end class to footer
  postFooter.classList.add("justify-content-end");

  // add cancel button and save button
  const editCancelButton = document.createElement('button');
  editCancelButton.className = "btn btn-outline-secondary btn-sm m-1";
  editCancelButton.innerHTML = "Cancel";

  const editSaveButton = document.createElement('button');
  editSaveButton.className = "btn btn-outline-primary btn-sm m-1";
  editSaveButton.innerHTML = "Save";

  postFooter.append(editCancelButton);
  postFooter.append(editSaveButton);

  // add onclick events for the two buttons
  editCancelButton.onclick = event => {
    event.preventDefault();

    // if we cancel, we add everything back like it was
    // and remove the edit elements

    // restore header
    postUsername.style.display = 'block';
    postEditButton.style.display = 'block';
    editTitle.remove();

    // restore post text
    editTextArea.remove();
    postText.innerHTML = oldText;

    // restore footer
    postLikeButton.style.display = 'block';
    postLikeCount.style.display = 'block';
    postTimestamp.style.display = 'block';

    postFooter.classList.remove("justify-content-end");
    editCancelButton.remove();
    editSaveButton.remove();
  }

  editSaveButton.onclick = event => {
    event.preventDefault();

    // restore everything with the value of textarea
    // use PUT method to update the database
    newText = editTextArea.value;

    fetch(`/post/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({
        edit: newText
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);

      // restore header
      postUsername.style.display = 'block';
      postEditButton.style.display = 'block';
      editTitle.remove();

      // restore post text
      editTextArea.remove();
      postText.innerHTML = newText;

      // restore footer
      postLikeButton.style.display = 'block';
      postLikeCount.style.display = 'block';
      postTimestamp.style.display = 'block';

      postFooter.classList.remove("justify-content-end");
      editCancelButton.remove();
      editSaveButton.remove();

    }); // end of .then for PUT fetch for editing

  } // end of onclick for save button

} // end of editPost()


function paginationFunctionality(result, postsFilter, username) {
  // adds onclick event listeners
  // makes it so we can only click next when there is a next page (same for prev)


  // determine which paginator we are dealing with
  if (postsFilter == "profile") {

    paginationDiv = document.querySelector('#profile-pagination-nav');
    prevPageButton = document.querySelector('#prof-prev-page-nav');
    nextPageButton = document.querySelector('#prof-next-page-nav');

  } else { // postsFilter is all or following

    paginationDiv = document.querySelector('#pagination-nav');
    prevPageButton = document.querySelector('#prev-page-nav');
    nextPageButton = document.querySelector('#next-page-nav');

  }

  // pagination navigation
  if (result.num_pages == 1) {
    // only one page, so we don't need next/prev buttons

    // hide the pagination-nav div
    paginationDiv.style.display = 'none';

  } else {
    // there are multiple pages

    // show the pagination-nav div
    paginationDiv.style.display = 'block';

    // determine if next or prev needs to be disabled
    if (result.current_page == 1) {

      prevPageButton.classList.add("disabled");
      prevPageButton.childNodes[0].setAttribute('aria-disabled', true);
      prevPageButton.childNodes[0].setAttribute('tabindex', "-1");

      nextPageButton.classList.remove("disabled");
      nextPageButton.childNodes[0].removeAttribute('aria-disabled');
      nextPageButton.childNodes[0].removeAttribute('tabindex');

    } else if (result.current_page == result.num_pages) {

      prevPageButton.classList.remove("disabled");
      prevPageButton.childNodes[0].removeAttribute('aria-disabled');
      prevPageButton.childNodes[0].removeAttribute('tabindex');

      nextPageButton.classList.add("disabled");
      nextPageButton.childNodes[0].setAttribute('aria-disabled', true);
      nextPageButton.childNodes[0].setAttribute('tabindex', "-1");

    } else {

      nextPageButton.classList.remove("disabled");
      nextPageButton.childNodes[0].removeAttribute('aria-disabled');
      nextPageButton.childNodes[0].removeAttribute('tabindex');

      prevPageButton.classList.remove("disabled");
      prevPageButton.childNodes[0].removeAttribute('aria-disabled');
      prevPageButton.childNodes[0].removeAttribute('tabindex');

    }

    // event listener for previous button
    prevPageButton.onclick = event => {
      event.preventDefault();

      // make sure the button isn't disabled
      if (!prevPageButton.classList.contains("disabled")) {

        // load the view with the previous page
        if (postsFilter == "profile") {

          loadProfileView(username, result.current_page - 1);

        } else {

          loadPostsView(postsFilter, result.current_page - 1);

        }

      }

    } // end of onclick for prevPageButton

    // event listener for next button
    nextPageButton.onclick = event => {
      event.preventDefault();

      // make sure the button isn't disabled
      if (!nextPageButton.classList.contains("disabled")) {

        // load the view with the previous page
        if (postsFilter == "profile") {

          loadProfileView(username, result.current_page + 1);

        } else {

          loadPostsView(postsFilter, result.current_page + 1);

        }

      }

    } // end of onclick for nextPageButton

  } // end of else

} // end of paginationFunctionality()
