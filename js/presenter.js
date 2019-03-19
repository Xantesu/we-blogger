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
            model.getAllBlogs((result) => {
                this.blogId = result[0].id;
                let lastUpdate = result[0].updated;
                for(let i in result){
                    if(result[i].updated > lastUpdate){
                        this.blogId = result[i].id;
                    }
                }
                router.navigateToPage('/overview/' + this.blogId);
                this.showNavbar(model.blogMap, model.getBlog(this.blogId));
            });
        }
        if(!model.loggedIn && this.blogId != -1) { // Wenn der Nuzter eingelogged war und sich abgemeldet hat
            console.log(`Nutzer ${this.owner} hat sich abgemeldet.`);
            this.blogId = -1;
            this.owner = undefined;
            let header = document.getElementById("mainheader");
            header.firstElementChild.remove();
            router.navigateToPage("/");
        }
        else if(!model.loggedIn && this.blogId === -1){
           this.showLogin();
        }
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

    showNavbar(blogs, blog){
        let mainheader = document.getElementById('mainheader');
        mainheader.appendChild(navbarView.render(blogs, blog, this.owner));
    },

    showEdit(postId) {
        let post = model.getPost(postId);
        let page = editView.render(post, this.extractPostInformation(post.content));
        this.replace(page);
    },

    showCreate(){
        let page = createView.render([{
            id: 0,
            html: 'p',
            full_html: '<p></p>',
            content: '',
        }]);
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

    showLogin(){
        let page = loginView.render();
        this.replace(page);
    },

    showOverview(id) {
        let blog = model.getBlog(id);
        this.blogId = id;
        model.getAllPostsOfBlog(id, (result) => {
            let page = overView.render(result, blog);
            this.replace(page);
        });
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

    refreshAll(redirect){
        model.getAllBlogs((result) => {
            console.log("Refreshed Blogs.");
            model.getAllPostsOfBlog(this.blogId, (result) => {
                console.log("Refreshed Posts.");
                if(redirect){
                    if (router.routeHistory[0] === ""){
                        router.navigateToPage(router.routeHistory[1]);
                    } else if(router.routeHistory[1].split("/")[1] === "overview") {
                        router.navigateToPage(router.routeHistory[1]);
                    } else {
                        router.navigateToPage(router.routeHistory[0]);
                    }
                }
                navbarView.updateSelect(model.getBlog(this.blogId), model.blogMap);
            });
        });
    },

    deletePost(pId){
        model.deletePost(this.blogId, pId, (result) => {
            if(router.routeHistory[1].split('/')[1] === 'overview'){
                this.refreshAll(false);
                overView.removePost(pId);
            } else {
                this.refreshAll(true);
            }
        });
    },

    createPost(title, content){
        model.addNewPost(this.blogId, title, content, (result) => {
            this.refreshAll(true);
        });
    },

    updatePost(pid, title, content){
        model.updatePost(this.blogId, pid, title, content, (result) => {
            this.refreshAll(true);
        });
    },

    createPostContent(content) {
        let result = "";
        return(result);
    },

    // Funktion, die den Inhalt von einem Post bezogen auf die verwendeten HTML Elemente aufteilt.
    // Als Ergebnis wird ein Array aus Objekten, welche das verwendete HTML Elemente, weitere Optionen,
    // vorhandene innere Element und den Inhalt speichert, zurückgegeben.
    extractPostInformation(content) {
//         let post = `Hello its me!<span style="background-color: white; font-family: &quot;Open Sans&quot;, Arial, sans-serif; font-size: 14px; text-align: justify;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse non rutrum ante. Vivamus vehicula, purus a congue semper, lorem erat pellentesque sapien, nec vulputate nisl mauris vel felis. Etiam posuere, leo eget convallis fermentum, arcu metus pharetra arcu, nec elementum nulla nunc maximus ligula. Donec laoreet feugiat velit in malesuada. Sed placerat nibh nisl, pellentesque ornare orci malesuada ac.</span><br />
// <a href="http://3.bp.blogspot.com/-jH2HX5VKXO4/XIfp0ZYEW4I/AAAAAAAAABw/eIxvynh948gChekY94pDECf9822alZhxgCK4BGAYYCw/s1600/sea-1337565_1920.jpg" imageanchor="1"><img border="0" height="211" src="https://3.bp.blogspot.com/-jH2HX5VKXO4/XIfp0ZYEW4I/AAAAAAAAABw/eIxvynh948gChekY94pDECf9822alZhxgCK4BGAYYCw/s320/sea-1337565_1920.jpg" width="320" /></a><a href="http://1.bp.blogspot.com/-x5Risrfj1iw/XIfp09R4u9I/AAAAAAAAAB4/YZThr-thmKUnido1vy_g_jfntRK9pxarACK4BGAYYCw/s1600/maldives-1993704_1920.jpg" imageanchor="1"><img border="0" height="179" src="https://1.bp.blogspot.com/-x5Risrfj1iw/XIfp09R4u9I/AAAAAAAAAB4/YZThr-thmKUnido1vy_g_jfntRK9pxarACK4BGAYYCw/s320/maldives-1993704_1920.jpg" width="320" /></a><br />
// <span style="background-color: white; font-family: &quot;Open Sans&quot;, Arial, sans-serif; font-size: 14px; text-align: justify;">Nullam condimentum leo massa. Morbi tincidunt turpis vitae fringilla tincidunt. Integer quis semper dolor, quis lacinia nisi. Sed rutrum dui vel fermentum dapibus. Fusce sagittis, eros a accumsan imperdiet, diam ligula tincidunt mi, eu commodo sapien mi id erat. Sed vitae hendrerit odio. Mauris ut urna non lacus lobortis interdum. In dolor mauris, ultrices eu venenatis at, consectetur et sem. Vestibulum eget rutrum arcu.</span>
// <br />
// That is really cool man
// <div class="separator" style="clear: both; text-align: center;">
// <a href="https://1.bp.blogspot.com/-8kC-xxO4A6c/W_aXRPSogsI/AAAAAAAAAAw/oLLRg2u4SjAhYEBSTnyAhzF1xjTdsjcpwCLcBGAs/s1600/wallpaper.jpg" imageanchor="1" style="margin-left: 1em; margin-right: 1em;"><img border="0" data-original-height="1067" data-original-width="1600" height="213" src="https://1.bp.blogspot.com/-8kC-xxO4A6c/W_aXRPSogsI/AAAAAAAAAAw/oLLRg2u4SjAhYEBSTnyAhzF1xjTdsjcpwCLcBGAs/s320/wallpaper.jpg" width="320" /></a></div>
// <br />`;
        let post = content;

        let regex = /<(.|\n)*?>/ig;

        let re_result = post.match(regex);
        if(re_result === null){
            return [
                {
                    html: 'none',
                    full_html: content,
                    content: content,
                    innerElements: undefined,
                },
            ];
        }

        let post_result = [];

        let special_elems = ["a", "img"];
        special_elems = [];

        let counter = 0;
        let idcounter = 0;
        while(post.length > 1){
            // console.log("POST RIGHT NOW");
            // console.log(post);
            post = post.replace(/^\s+/, '');
            let my_match = re_result[counter];
            // console.log("I matched " + my_match);
            //Falls es Text gibt, der ohne HTML Tags angezeigt werden soll
            if(post.indexOf(my_match) !== 0){
                let postObject = {
                    id: idcounter,
                    html: 'none',
                    full_html: post.slice(0, post.indexOf(my_match)),
                    content: post.slice(0, post.indexOf(my_match)),
                    innerElements: undefined,
                }
                idcounter++;
                post_result.push(postObject);
                post = post.substr(post.indexOf(my_match), post.length);
                continue;
            }
            if(my_match === "<br />"){
                let postObject = {
                    id: idcounter,
                    html: "br",
                    full_html: "<br />",
                    content: undefined,
                    innerElements: undefined,
                }
                idcounter++;
                post_result.push(postObject);
                counter++;
                post = post.substr(6, post.length);
                continue;
            }
            let html_element = my_match.match(/\w+/)[0];
            // console.log("Current HTML Element " + html_element);
            let html_element_ending = "</" + html_element + ">";
            // console.log("Current HTML Ending " + html_element_ending);
            if(re_result[counter+1] === html_element_ending){
                // console.log("Next Element in Array is also the ending");
                let firstIndex = post.indexOf(my_match);
                let secondIndex = post.indexOf(html_element_ending);
                let content = post.slice(firstIndex + my_match.length, secondIndex);
                let postObject = {
                    id: idcounter,
                    html: html_element,
                    full_html: my_match + content + html_element_ending,
                    content: content,
                    innerElements: undefined,
                };
                idcounter++;
                post_result.push(postObject);
                counter += 2;
                post = post.substr(secondIndex + html_element_ending.length, post.length);
                // console.log(post_result);
                continue;
            } else if(special_elems.indexOf(html_element) > -1) { 

            } else {
                // console.log("Found nested element");
                let firstIndex = post.indexOf(my_match);
                let postObject = {
                    id: idcounter,
                    html: html_element,
                    full_html: my_match,
                    content: undefined,
                    innerElements: [],
                }
                idcounter++;
                let pointedElement = re_result[counter+1];
                while(pointedElement !== html_element_ending){
                    postObject.innerElements.push(pointedElement);
                    postObject.full_html += pointedElement;
                    counter++;
                    pointedElement = re_result[counter+1];
                }
                postObject.innerElements.push(pointedElement);
                postObject.full_html += pointedElement;
                post_result.push(postObject);
                // post = post.substr(firstIndex, post.indexOf(pointedElement) + pointedElement.length);
                post = post.substr(post.indexOf(pointedElement)+pointedElement.length, post.length);
                counter+=2;
                // console.log(post_result);
            }
        }
        return post_result;
    },
};
