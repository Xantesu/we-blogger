"use strict";

const overView = {

    render(posts, blog){
        let page = document.getElementById("view-overview-posts").cloneNode(true);
        let buttons = page.getElementsByTagName("button");
        let openBlogButton = buttons[0];
        openBlogButton.addEventListener('click', function(){
            window.open(blog.url);
        });
        let addPostButton = buttons[1]; 
        addPostButton.addEventListener('click', helper.navEvent);
        page.removeAttribute("id");
        for(let post of posts){
            let article = document.getElementById("post").cloneNode(true);
            article.hidden = false;
            article.removeAttribute("id");
            article.className = "overview-post";
            helper.setDataInfo(post, article, false);
            let navitems = article.getElementsByTagName("li");

            let buttonDetail = navitems[0].getElementsByTagName("button")[0];
            buttonDetail.className = post["id"];
            buttonDetail.addEventListener("click", helper.navEvent);

            let buttonDelete = navitems[1].getElementsByTagName("button")[0];
            buttonDelete.className = post["id"];
            buttonDelete.addEventListener('click', helper.deletePostEvent);

            let buttonEdit = navitems[2].getElementsByTagName("button")[0];
            buttonEdit.className = post["id"];
            buttonEdit.addEventListener('click', helper.navEvent);

            page.append(article);
        }
        return page;
    }

};

const detailView = {

    render(post, comments){
        let page = document.getElementById("view-detail-post").cloneNode(true);
        page.removeAttribute("id");
        helper.setDataInfo(post, page, true);
        let delButton = page.getElementsByTagName("button")[0];
        delButton.addEventListener('click', helper.deletePostEvent);
        delButton.className = post.id;
        let editButton = page.getElementsByTagName("button")[1];
        editButton.addEventListener('click', helper.navEvent);
        editButton.className = post.id;
        let button = page.getElementsByTagName("button")[2];
        button.className = post.id;
        button.addEventListener('click', function(){
            router.navigateToPage("/overview/" + post.blog.id);
        });
        if(!(comments === undefined)){
            for(let comment of comments){
                let article = document.getElementById("comment").cloneNode(true);
                article.removeAttribute("id");
                article.hidden = false;
                helper.setDataInfo(comment, article, true);
                let delComment = article.getElementsByTagName("button")[0];
                delComment.className = comment.id;
                delComment.addEventListener('click', function(event){
                    if(confirm("Möchten Sie wirklich diesen Kommentar löschen?")){
                        let cid = event.target.className;
                        presenter.deleteComment(post.id, cid);
                        console.log("Dieser Kommentar wurde erfolgreich gelöscht.");
                    }
                });
                page.append(article);
            }
        }
        return page;
    }
};

const editView = {
    
    render(post) {
        let page = document.getElementById("view-edit-post").cloneNode(true); 
        page.removeAttribute("id");
        helper.setDataInfo(post, page, true);
        let inputTitle = page.getElementsByTagName("input")[0];
        inputTitle.value = post.title;
        let buttons = page.getElementsByTagName("button");
        let savePostButton = buttons[0];
        let form = page.querySelector("form");
        savePostButton.addEventListener('click', (event) => {
            let title = form.title.value;
            let content = form.content.value;
            if(!post.id){
                presenter.createPost(title, content);
                console.log("Dieser Post wurde erfolgreich erstellt.");
            } else {
                presenter.updatePost(post.id, title, content);
                console.log("Dieser Post wurde erfolgreich überarbeitet.");
            }
            event.preventDefault();
        });
        let backButton = buttons[1];
        backButton.addEventListener('click', function(){
            router.navigateToPage(router.routeHistory[0]);
        });
        return page;

    }
}

const helper = {
    setDataInfo(object, page, longDate) {
        let cont = page.innerHTML;
        for(let key in object){
            if(typeof object[key] == "object"){
                helper.setDataInfo(object[key], page);
            }
            //behandle Ausnahmen, bei denen zusätzlich Methoden aufgerufen werden müssen
            if(key === "published" || key === "updated"){
                cont = cont.replace("%" + key, presenter.formatDate(longDate, object[key]));
            } else if(key === "replies") {
                cont = cont.replace("%numberComments", object["replies"].totalItems);
            } else if(key === "author") {
                cont = cont.replace("%author", object["author"].displayName);
            } else {
                cont = cont.replace("%" + key, object[key]);
            }
        }
        page.innerHTML = cont;
    },

    deletePostEvent(event){
        let pId = event.target.className;
        if(confirm("Möchten Sie wirklich diesen Post löschen?")){
            presenter.deletePost(pId);
            console.log("Der Post wurde erfolgreich gelöscht.");
        }
    },

    navEvent(event){
        let target = event.target;
        let pId = target.className;
        router.navigateToPage(target.dataset.action + "/" + pId);
    },
}
