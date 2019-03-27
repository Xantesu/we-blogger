"use strict";

const navbarView = {
    generateNavbar(currentBlog, blogs) {
        let page = document.getElementById("blog-navigation").cloneNode(true);
        page.removeAttribute("id");
        let dropdown_btn = page.getElementsByClassName("dropbtn")[0];
        let container = page.getElementsByClassName("dropdown-content")[0];
        let blogRedirect = page.getElementsByTagName("i")[1];
        blogRedirect.addEventListener("click", function () {
            window.open(currentBlog.url);
        });
        dropdown_btn.addEventListener('click', function (event) {
            container.id = container.id === "dropdown-clicked" ? "" : "dropdown-clicked";
        });
        for (let [id, blog] of blogs) {
            let a = container.getElementsByTagName("a")[0].cloneNode(true);
            a.hidden = false;
            a.className = blog.id + " link";
            if (blog === currentBlog) {
                a.className += " link-clicked";
            } else {
                a.className = a.className.replace("link-clicked", "");
            }
            a.innerHTML = blog.name + " (" + blog.posts.totalItems + " Posts) Erscheinungsdatum: " + presenter.formatDate(false, blog.published) + " / Letzte Änderung:" + presenter.formatDate(false, blog.updated);
            a.addEventListener('click', helper.navEvent);
            container.appendChild(a);
        }
        return page;
    },

    updateSelect(currentBlog, blogs) {
        let nav = document.getElementsByClassName("navigation")[0];
        if (nav.firstElementChild) {
            nav.firstElementChild.remove();
        }
        nav.appendChild(navbarView.generateNavbar(currentBlog, blogs));
    },

    render(blogs, currentBlog, owner) {
        let page = document.getElementById("headertemp").cloneNode(true);
        helper.setDataInfo({
            owner: owner
        }, page, false);
        page.removeAttribute("id");
        let li = page.getElementsByClassName("navigation")[0];
        li.appendChild(navbarView.generateNavbar(currentBlog, blogs));
        let homepage = page.getElementsByClassName("logo")[0];
        homepage.addEventListener('click', function () {
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
        if (mainheader.firstElementChild) {
            mainheader.firstElementChild.remove();
        }
        return page;
    }
};


const loginView = {
    render() {
        let page = document.getElementById("view-login").cloneNode(true);
        page.removeAttribute("id");
        let baseLogin = document.getElementById("sign-in-or-out-button");
        let myLogin = document.getElementById("sign-in-or-out-button").cloneNode(true);
        myLogin.removeAttribute("id");
        myLogin.addEventListener('click', function () {
            baseLogin.click();
        });
        page.appendChild(myLogin);
        return page;
    }
};

const overView = {
    render(posts, blog) {
        let page = document.getElementById("view-overview-posts").cloneNode(true);
        page.removeAttribute("id");
        let buttons = page.getElementsByTagName("button");
        // let addPostButton = page.getElementsByClassName("overview-nav")[0];
        page.innerHTML = page.innerHTML.replace("%name", blog["name"]);
        let addPostButton = page.querySelector("i");
        addPostButton.addEventListener('click', helper.navEvent);
        let container = page.querySelector("div");
        for (let post of posts) {
            let article = document.getElementById("post").cloneNode(true);
            article.hidden = false;
            // article.removeAttribute("id");
            article.id = post.id;
            // article.className = "overview-post";
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
            container.appendChild(article);
        }
        return page;
    },

    removePost(pId) {
        let posts = document.getElementsByTagName("article");
        for (let post of posts) {
            if (post.id === pId) {
                post.remove();
                break;
            }
        }
    }
};

const detailView = {

    render(post, comments) {
        let page = document.getElementById("view-detail-post").cloneNode(true);
        page.removeAttribute("id");
        helper.setDataInfo(post, page, true);
        let delButton = page.getElementsByTagName("button")[0];
        delButton.addEventListener('click', helper.deletePostEvent);
        delButton.className = post.id;
        let editButton = page.getElementsByTagName("button")[1];
        editButton.addEventListener('click', helper.navEvent);
        editButton.className = post.id;
        let backbutton = page.getElementsByTagName("button")[2];
        backbutton.className = post.blog.id;
        backbutton.addEventListener('click', helper.navEvent);
        // router.navigateToPage("/overview/" + post.blog.id);
        // });
        let container = page.getElementsByClassName("post-container")[0];
        if (comments) {
            for (let comment of comments) {
                let article = document.getElementById("comment").cloneNode(true);
                article.removeAttribute("id");
                article.hidden = false;
                article.className = comment.id;
                helper.setDataInfo(comment, article, true);
                let delComment = article.getElementsByTagName("button")[0];
                delComment.className = comment.id;
                delComment.addEventListener('click', function (event) {
                    if (confirm("Möchten Sie wirklich diesen Kommentar löschen?")) {
                        let cid = event.target.className;
                        presenter.deleteComment(post.id, cid);
                        detailView.removeComment(cid);
                        console.log("Dieser Kommentar wurde erfolgreich gelöscht.");
                    }
                });
                container.append(article);
            }
        } else {
            let noCommentsParagraph = document.createElement("p");
            noCommentsParagraph.innerHTML = "Es gibt anscheinend keine Kommentare.";
            page.appendChild(noCommentsParagraph);
        }
        return page;
    },

    removeComment(cId) {
        let page = document.getElementById("main-content");
        let articles = page.getElementsByTagName("article");
        for (let comment of articles) {
            if (comment.className === cId) {
                comment.remove();
                break;
            }
        }
    },
};

const editView = {

    render(post, post_object) {
        let page = document.getElementById("view-edit-post").cloneNode(true);
        page.removeAttribute("id");
        helper.setDataInfo(post, page, true);
        let inputTitle = page.getElementsByTagName("input")[0];
        inputTitle.value = post.title;
        let container = page.getElementsByClassName("textarea-container")[0];
        let counter = 100000;
        let buttons = page.getElementsByTagName("button");
        // Melde Eventlistener für die Buttons, die einen neuen Paragraph erstellen, an
        buttons[0].addEventListener('click', function (event) {
            helper.addParagraphEvent(event, page, post_object, counter);
            container++;
        });
        buttons[1].addEventListener('click', function (event) {
            helper.addParagraphEvent(event, page, post_object, counter);
            container++;
        });
        let savePostButton = buttons[2];
        let form = page.querySelector("form");
        savePostButton.addEventListener('click', (event) => {
            event.preventDefault();
            let title = form.title.value;
            let post_content = helper.getPostContent(page, post_object);
            presenter.updatePost(post.id, title, post_content);
            console.log("Dieser Post wurde erfolgreich überarbeitet.");
        });
        let backButton = buttons[3];
        backButton.addEventListener('click', function () {
            router.navigateToPage(router.routeHistory[0]);
        });
        for (let obj of post_object) {
            let elem = document.getElementById("content-textarea").cloneNode(false);
            elem.removeAttribute("id");
            elem.hidden = false;
            if (obj.html === 'p' || obj.html === 'none' || obj.html === 'span' || (obj.html === 'div' && !obj.innerElements)) {
                elem.value = obj.content;
                container.appendChild(elem);
            } else if ((obj.html === 'div' && obj.innerElements) || obj.html === 'a' || obj.html === "img") {
                let pic;
                if (obj.html === 'div') {
                    pic = document.createElement("div");
                    pic.innerHTML = obj.full_html;
                } else if (obj.html === 'a') {
                    pic = document.createElement("a");
                    pic.innerHTML = obj.full_html;
                } else if (obj.html === 'img'){
                    pic = document.createElement("div");
                    pic.innerHTML = obj.full_html;
                }
                pic.id = obj.id;
                container.appendChild(pic);
            }
            elem.id = obj.id;
        }
        return page;

    }
};

const createView = {

    render(post_object) {
        let page = document.getElementById("view-create-post").cloneNode(true);
        let container = page.getElementsByClassName("textarea-container")[0];
        let form = page.querySelector("form");
        let buttons = page.getElementsByTagName("button");
        let counter = 10000;
        buttons[0].addEventListener('click', function (event) {
            helper.addParagraphEvent(event, page, post_object, container);
            counter++;
        });
        buttons[1].addEventListener('click', function (event) {
            helper.addParagraphEvent(event, page, post_object, container);
            counter++;
        });
        buttons[2].addEventListener('click', function (event) {
            event.preventDefault();
            let container = page.getElementsByClassName("textarea-container")[0];
            let title = form.title.value;
            let post_content = helper.getPostContent(page, post_object);
            console.log(post_content);
            presenter.createPost(title, post_content);
            console.log("Dieser Post wurde erfolgreich überarbeitet.");
        });
        buttons[3].addEventListener('click', function () {
            router.navigateToPage(router.routeHistory[0]);
        });
        return page;
    },

};

const helper = {
    setDataInfo(object, page, longDate) {
        let cont = page.innerHTML;
        for (let key in object) {
            if (typeof object[key] == "object") {
                helper.setDataInfo(object[key], page);
            }
            //behandle Ausnahmen, bei denen zusätzlich Methoden aufgerufen werden müssen
            if (key === "published" || key === "updated") {
                cont = cont.replace("%" + key, presenter.formatDate(longDate, object[key]));
            } else if (key === "replies") {
                cont = cont.replace("%numberComments", object["replies"].totalItems);
            } else if (key === "author") {
                cont = cont.replace("%author", object["author"].displayName);
            } else {
                cont = cont.replace("%" + key, object[key]);
            }
        }
        page.innerHTML = cont;
    },

    // Funktion, die den Inhalt (Bilder und Textareas) zusammenfasst und ein Array aus Objekten zurückgibt,
    // die den Inhalt + Formatierung mit HTML Tags beinhalten
    getPostContent(page, post_object) {
        let container = page.getElementsByClassName("textarea-container")[0];
        let post_content = "";
        let childNodes = container.children;
        for (let i = 0; i < childNodes.length; i++) {
            // Da jedes Element (Textarea oder Bild) zu einem Objekt in post_object gehört, wird zunächst einmal
            // das zum Element dazugehörige Objekt durch die ID gefunden
            let content_obj = post_object.find(el => {
                return el.id == childNodes[i].id;
            });
            // Wenn es sich um ein Element handelt, welches Text beinhaltet
            if (content_obj && helper.arrayContainsElement(helper.textElements, content_obj.html)) {
                // console.log(content_obj.full_html);
                // content_obj.full_html = content_obj.full_html.split(">")[1].split("<")[0];
                // console.log(content_obj.full_html);

                // Filtere die Tags mit den Formatierungen heraus, um den neuen Inhalt reinzusetzen.
                // Bsp: Beim Erstellen der EditView Seite wurde ein post_object Array übergeben, welcher zB ein Objekt
                // beinhaltet mit folgendem full_html Attribut: <span class="xyz">TEST INHALT</span>
                // Wenn der Inhalt nun durch eine Textarea verändert wird, werden die beiden span Tags herausgefiltert,
                // und um den neuen Inhalt gepackt
                let tags = content_obj.full_html.match(/<(.|\n)*?>/ig);
                if (tags) {
                    post_content += tags[0] + childNodes[i].value + tags[1];
                } else {
                    post_content += childNodes[i].value;
                }
            } 
            if (content_obj && helper.arrayContainsElement(helper.imageElements, content_obj.html)) {
                post_content += content_obj.full_html;
            }
            if(content_obj && content_obj.html === 'div'){
                if(content_obj.innerElements){
                    post_content += content_obj.full_html;
                } else {
                    let tags = content_obj.full_html.match(/<(.|\n)*?>/ig);
                    if (tags) {
                        post_content += tags[0] + childNodes[i].value + tags[1];
                    } else {
                        post_content += childNodes[i].value;
                    }
                }
            }
        }
        // Der String, der den neuen Post Inhalt beinhaltet
        return post_content;
    },

    deletePostEvent(event) {
        let pId = event.target.className;
        if (confirm("Möchten Sie wirklich diesen Post löschen?")) {
            presenter.deletePost(pId);
            console.log("Der Post wurde erfolgreich gelöscht.");
        }
    },

    navEvent(event) {
        event.preventDefault();
        let target = event.target;
        // let pId = target.className;
        let pId = target.classList[0];
        router.navigateToPage(target.dataset.action + "/" + pId);
    },

    arrayContainsElement(array, element) {
        return array.indexOf(element) > -1;
    },

    addParagraphEvent(event, page, post_object, counter) {
        let container = page.getElementsByClassName("textarea-container")[0];
        event.preventDefault();
        let target = event.target;
        let type = target.classList[1];
        let elem = page.getElementsByTagName("textarea")[0].cloneNode(false);
        // console.log(elem);
        elem.value = '';
        elem.hidden = false;
        post_object.push({
            id: counter,
            html: 'p',
            full_html: '<p></p>',
            content: '',
        });
        elem.id = counter;
        if (type === 'prepend') {
            container.prepend(elem);
        } else {
            container.appendChild(elem);
        }
    },

    textElements: ['p', 'span', 'none'],
    imageElements: ['a', 'br', 'img'],

}