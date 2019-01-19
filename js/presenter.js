/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
 "use strict";

const presenter = {
    blogId: -1,
    owner: undefined,
    
    // Wird aufgerufen, wenn die Startseite angezeigt wird
    initPage() {
        if (model.loggedIn) { // Wenn der Nutzer eingeloggt ist
            // Nutzer abfragen und Anzeigenamen als owner setzen
            console.log("EINGELOGGT");
            model.getSelf((result) => {
                this.owner = result.displayName;
                console.log(`Nutzer ${this.owner} hat sich angemeldet.`);
            });
            this.blogId = 1;
            // Hier kommt Ihr Code hin 
            let blog;
            model.getAllBlogs((result) => {
                this.blogId = result[0].id;
                //console.log(result);
                let lastUpdate = result[0].updated;
                let blogname = result[0].name;
                var latestBlog = result[0];
                for(let i in result){
                    //console.log(result[i].name);
                    if(result[i].updated > lastUpdate){
                        this.blogId = result[i].id;
                        lastUpdate = result[i].updated;
                        blogname = result[i].name;
                        latestBlog = result[i];
                    }
                }
                console.log(this.owner);

                //this.renderHeader(latestBlog);
                //this.renderNavbar(result, latestBlog);


                router.navigateToPage('/overview/' + this.blogId);
                //this.showOverview();

                //this.renderPostsOfBlog(this.blogId);
            });

        } 
        if(!model.loggedIn && this.blogId != -1) { // Wenn der Nuzter eingelogged war und sich abgemeldet hat
            console.log(`Nutzer ${this.owner} hat sich abgemeldet.`);
            this.blogId = -1;
            this.owner = undefined;
        }
    },

    getNavbar(blogs, currentBlog) {
        console.log(currentBlog);
        let page = document.getElementById("blog-navigation").cloneNode(true); 
        page.removeAttribute("id");
        let select = page.getElementsByTagName("select")[0];
        for (let blog of blogs) {
            select.append(new Option(blog.name + " (" + blog.posts.totalItems + " Posts) Erscheinungsdatum: " + this.formatDate(false, blog.published) + " / Letzte Änderung:" +  this.formatDate(false, blog.updated), blog.id));
        }
        select.addEventListener('change', function(event){
            let id = event.target.value;
            router.navigateToPage("/overview/" + id);
        });
        select.value = currentBlog.id;
        return page;
    },
    
    renderNavbar(blogs, currentBlog) {
        console.log(currentBlog);
        let page = document.getElementById("headertemp").cloneNode(true);
        page.removeAttribute("id");
        page.innerHTML = page.innerHTML.replace("%owner", this.owner);
        let li = page.getElementsByTagName("li")[1];
        li.append(this.getNavbar(blogs, currentBlog));
        if(mainheader.firstElementChild){
            mainheader.firstElementChild.remove();
        }
        mainheader.append(page);
    },

    renderHeader(latestBlog) {
        let page = document.getElementById("header").cloneNode(true);
        page.removeAttribute("id");
        let cont = page.innerHTML;
        cont = cont.replace("%owner", this.owner);
        cont = cont.replace("%name", latestBlog["name"]);
        cont = cont.replace("%numberPosts", latestBlog["posts"].totalItems);
        cont = cont.replace("%published", this.formatDate(false, latestBlog["published"]));
        cont = cont.replace("%updated", this.formatDate(false, latestBlog["updated"]));
        page.innerHTML = cont;
        //let mainheader = document.getElementById("main-header");
        if(mainheader.firstElementChild){
            mainheader.firstElementChild.remove();
        }
        mainheader.append(page);
    },

    replace(page) {
        let main = document.getElementById("main-content");
        if(main.firstElementChild){
            main.firstElementChild.remove();
        }
        if(page){
            main.append(page);
        }
    },

    showEdit(postId) {
        let post = model.getPost(postId);
        if(!post){
            post = {
                'title': "",
                'content': "",
                'published': new Date(),
                'updated': new Date(),
            };
        };
        let page = editView.render(post);
        this.replace(page);
    },

    showDetail(postId) {
        let post = model.getPost(postId);
        let blogId = post.blog.id;
        model.getAllCommentsOfPost(blogId, postId, (result) => {
            let page = detailView.render(post, result);
            this.replace(page);
        });
    },

    showOverview(id) {
        let blog = model.getBlog(id);
        console.log(model.blogMap)
        console.log(blog);
        while(!blog){
            blog = model.getBlog(id);
        }
        this.blogId = id;
        model.getAllPostsOfBlog(id, (result) => {
            let page = overView.render(result, blog);
            /*this.renderHeader(blog);*/
            this.replace(page);
        })
        model.getAllBlogs((result) => this.renderNavbar(result, blog));
    },

    getAmountOfPosts(){
        return model.getBlog(this.blogId).posts.totalItems;
    },


    // Gibt den Post mit der Id bid aus
    renderPostsOfBlog(bid) {
        let posts;
        model.getAllPostsOfBlog(bid, (result) => {
            posts = result;
            for(let i in posts){
                this.printPostInformation(posts[i]);
            }
        });
    },

    printPostInformation(post){
        console.log(post.title);
        console.log(this.formatDate(false, post.published) + " / " + post.updated);
        console.log(post.content);
    },

    // Formatiert den Datum-String in date in zwei mögliche Datum-Strings: 
    // long = false: 24.10.2018
    // long = true: Mittwoch, 24. Oktober 2018, 12:21
    formatDate(long, date) {
        let o1 = {year: 'numeric', month: 'numeric', day: 'numeric'};
        let o2 = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
        let formated = new Date(date);
        if(long){
            return formated.toLocaleDateString('de-DE', o2);            
        } else {
            return formated.toLocaleDateString('de-DE', o1);
        }

    },

    deleteComment(pId, cId){
        model.deleteComment(this.blogId, pId, cId, (result) => console.log(result));
    },

    refreshAll(){
        model.getAllBlogs((result) => {
            console.log("Refreshed Blogs.");
            model.getAllPostsOfBlog(this.blogId, (result) => {
                console.log("Refreshed Posts."); 
                if (router.routeHistory[0] === ""){
                    router.navigateToPage(router.routeHistory[1]);
                } else if(router.routeHistory[1].split("/")[1] === "overview") {
                    router.navigateToPage(router.routeHistory[1]); 
                    console.log("GEHE WIEDER Zur GLEICHEN SEITE");
                } else {
                    router.navigateToPage(router.routeHistory[0]);
                }
            }); 
        });
    },

    deletePost(pId){
        model.deletePost(this.blogId, pId, (result) => console.log(result));
        this.refreshAll();
    },

    createPost(title, content){
        model.addNewPost(this.blogId, title, content, (result) => console.log(result));
        this.refreshAll();
    },

    updatePost(pid, title, content){
        model.updatePost(this.blogId, pid, title, content, (result) => console.log(result)); 
    },

    createPostContent(content) {
        let result = "";
        return(result);
    }
};
