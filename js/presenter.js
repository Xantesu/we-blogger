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
            // Lade alle Blogs in die blogMap vom Model und übergebe die ID des aktuellsten Blogs zu this.blogId
            model.getAllBlogs((result) => {
                this.blogId = result[0].id;
                let lastUpdate = result[0].updated;
                for(let i in result){
                    if(result[i].updated > lastUpdate){
                        this.blogId = result[i].id;
                    }
                }
                // Routing zur Übersicht, zusätzlich wird der Header erstellt
                router.navigateToPage('/overview/' + this.blogId);
                this.showNavbar(model.blogMap, model.getBlog(this.blogId));
            });
        }
        if(!model.loggedIn && this.blogId != -1) { // Wenn der Nuzter eingelogged war und sich abgemeldet hat
            console.log(`Nutzer ${this.owner} hat sich abgemeldet.`);
            this.blogId = -1;
            this.owner = undefined;
            // Entferne den Header und navigiere zurück zur Startseite
            let header = document.getElementById("mainheader");
            header.firstElementChild.remove();
            router.navigateToPage("/");
        }
        else if(!model.loggedIn && this.blogId === -1){ // Wenn der Nutzer auf die Seite kommt und nicht eingeloggt war
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

    // Ersetze den gesamtent Inhalt aus main-content mit der übergebenen page. Genutzt um templates zu wechseln
    replace(page) {
        let main = document.getElementById("main-content");
        if(main.firstElementChild){
            main.firstElementChild.remove();
        }
        if(page){
            main.appendChild(page);
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
        // Funktion render bekommt ein Array mit einem Objekt, welches den Inhalt der Seite repräsentieren soll
        // Erklärung zu dem Objekt bei der Funktion presenter.extractPostInformation
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
            navbarView.updateSelect(blog, model.blogMap);
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

    // Durch die Funktionen getAllBlogs und getAllPostsOfBlog werden blog- und postMap vom Blog aktualisiert
    // Zusätzlich bestimmt der boolean 'redirect' darüber, ob es zu einer Weiterleitung kommt
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
            // Wenn ein Post von der Übersicht aus gelöscht wird, soll es zu keiner Weiterleitung kommen.
            // Stattdessen wird der Post von der View aus einfach gelöscht.
            if(router.routeHistory[1].split('/')[1] === 'overview'){
                this.refreshAll(false);
                overView.removePost(pId);
            } else {
                // Falls der Post beispielsweise von der Detail Seite gelöscht wird, soll zB zur Übersicht weitergeleitet werden
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
    // Diese Objekte werden dann beim Bearbeiten oder Erstellen eines Posts verwendet, um die Formatierung beizubehalten
    extractPostInformation(content) {
        let post = content;

        // Regulärer Ausdruck, der alle Tags, inklusive attribute, ausfindig macht
        let regex = /<(.|\n)*?>/ig;

        // Alle gefundenen Tags werden direkt im Array gespeichert (z.B. re_result = ['<span class="xyz" XYZ>], [</span>])
        let re_result = post.match(regex);
        if(re_result === null){
            // Post beinhaltet keine HTML Tags und Formatierungen
            return [
                {
                    html: 'none',
                    full_html: content,
                    content: content,
                    innerElements: undefined,
                },
            ];
        }
        // Array, der alle Objekte speichert und am Ende der Funktion zurückgegeben wird
        let post_result = [];
        let special_elems = ["a", "img"];
        special_elems = [];
        let counter = 0;
        // Counter, der genutzt wird um eine eindeutige ID für die Objekte zu erstellen
        let idcounter = 0;
        while(post.length > 1){
            // Entferne whitespaces, die sonst Probleme bereiten würden
            post = post.replace(/^\s+/, '');
            let my_match = re_result[counter];
            // Falls es Text gibt, der ohne HTML Tags angezeigt werden soll
            // Genauer: my_match beinhaltelt nun zB. <span>. Wenn sich dieses Tag also nicht am Anfang des Posts befindet,
            // folgt hier erstmal Text, der zu keinem Tag gehört
            if(post.indexOf(my_match) !== 0){
                let postObject = {
                    id: idcounter,
                    html: 'none',
                    // Folglich ist der Inhalt zunächst alles vom Anfang des Posts bis zum Tag
                    full_html: post.slice(0, post.indexOf(my_match)),
                    content: post.slice(0, post.indexOf(my_match)),
                    innerElements: undefined,
                }
                idcounter++;
                post_result.push(postObject);
                post = post.substr(post.indexOf(my_match), post.length);
                continue;
            }
            // Spezialfall
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
            // Extrahiere das exakte HTML Element
            // bsp. aus <span class="xyz" style="xyz" XYZ> wird 'span' extrahiert
            let html_element = my_match.match(/\w+/)[0];
            // baue das dazugehöriger Endtag auf, bsp: </span>
            let html_element_ending = "</" + html_element + ">";
            // Wenn das nächste gefundene Tag das dazugehörige Endtag ist, muss nurnoch der Inhalt zwischen den Tags
            // extrahiert werden
            if(re_result[counter+1] === html_element_ending){
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
                continue;
            // Wenn nicht, gibt es also weitere Tags im Inneren
            } else {
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
                // Iteriere durch alle folgenden Tags, bis das Ende gefunden wird
                while(pointedElement !== html_element_ending){
                    postObject.innerElements.push(pointedElement);
                    postObject.full_html += pointedElement;
                    counter++;
                    pointedElement = re_result[counter+1];
                }
                postObject.innerElements.push(pointedElement);
                postObject.full_html += pointedElement;
                post_result.push(postObject);
                post = post.substr(post.indexOf(pointedElement)+pointedElement.length, post.length);
                counter+=2;
            }
        }
        return post_result;
    },
};
