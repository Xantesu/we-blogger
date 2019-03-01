"use strict";

const navbarView = {
    render(blogs, currentBlog, owner){
        let generateNavbar = function(){
            let page = document.getElementById("blog-navigation").cloneNode(true);
            page.removeAttribute("id");
            let select = page.getElementsByTagName("select")[0];
            for (let [id, blog] of blogs) {
                select.appendChild(new Option(blog.name + " (" + blog.posts.totalItems + " Posts) Erscheinungsdatum: " + presenter.formatDate(false, blog.published) + " / Letzte Änderung:" +  presenter.formatDate(false, blog.updated), blog.id));
            }
            select.addEventListener('change', function(event){
                let id = event.target.value;
                router.navigateToPage("/overview/" + id);
            });
            select.value = currentBlog.id;
            let blogRedirect = page.getElementsByTagName("i")[0];
            blogRedirect.addEventListener("click", function(){
                window.open(currentBlog.url);
            });
            return page;
        };
        let page = document.getElementById("headertemp").cloneNode(true);
        page.removeAttribute("id");
        helper.setDataInfo({ owner: owner}, page, false);
        let li = page.getElementsByClassName("navigation")[0];
        li.append(generateNavbar());
        let homepage = page.getElementsByClassName("logo")[0];
        homepage.addEventListener('click', function(){
            window.open("http://localhost:8888", "_self");
        });
        let baseLogin = document.getElementById("sign-in-or-out-button");
        let login_li = page.getElementsByClassName("login")[0];
        let myLogin = baseLogin.cloneNode(true);
        myLogin.removeAttribute("id");
        myLogin.html = model.loggedIn ? 'Abmelden' : 'Anmelden';
        myLogin.addEventListener('click', function () {
            baseLogin.click();
        });
        login_li.appendChild(myLogin);
        if(mainheader.firstElementChild){
            mainheader.firstElementChild.remove();
        }
        return page;
    }
};


const loginView = {
      render(){
         let page = document.getElementById("view-login").cloneNode(true);
         page.removeAttribute("id");
         let baseLogin = document.getElementById("sign-in-or-out-button");
         let myLogin = document.getElementById("sign-in-or-out-button").cloneNode(true);
         myLogin.removeAttribute("id");
         myLogin.addEventListener('click', function(){
           baseLogin.click();
         });
         page.appendChild(myLogin);
         return page;
      }
};

const overView = {
    render(posts, blog){
        let page = document.getElementById("view-overview-posts").cloneNode(true);
        page.removeAttribute("id");
        let buttons = page.getElementsByTagName("button");
        let openBlogButton = buttons[0];
        // openBlogButton.addEventListener('click', function(){
        //     window.open(blog.url);
        // });
        // let addPostButton = buttons[1]; 
        let addPostButton = page.querySelector("i");
        addPostButton.addEventListener('click', helper.navEvent);
        let container = page.querySelector("div");
        for(let post of posts){
            let article = document.getElementById("post").cloneNode(true);
            article.hidden = false;
            article.removeAttribute("id");
            article.id = post.id;
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
            // page.appendChild(article);
            container.appendChild(article);
        }
        return page;
    },
    removePost(pId){
        let posts = document.getElementsByTagName("article");
        for(let post of posts){
           if(post.id === pId){
               post.remove();
               break;
           }
        }
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
        let container = page.getElementsByClassName("post-container")[0];
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
                container.append(article);
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
};

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
