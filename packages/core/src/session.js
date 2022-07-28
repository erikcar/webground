import { sessionStore, VERSION, webground as web, webObject, wocontext } from "./core";

export const userEnum = {GUEST: "0"}
export const session_default_decorator = (instance, option) => {
    //TODO:Logica Polyfill
    instance.polyfilled = true;

    const data = instance.data;

    if (!instance.restored) {
        if (navigator) {
            data.locale = navigator.languages && navigator.languages.length
                ? navigator.languages[0]
                : navigator.language;
        }
        else data.locale = option.language || 'it';
        data.language = option.language || instance.locale;
        data.timeout = option.timeout || 1800; //30 min
    }

    //Check Version se non è aggiornata forzo sync perchè user stored potrebbe essere non compatibile con nuova versione.
    const version = localStorage.getItem("version_");

    if (VERSION != version) {
        instance.syncronize |= version ? true : false;
        localStorage.setItem("version_", VERSION);
    }

    const last = sessionStorage.getItem("session_");
    instance.time = Math.floor(Date.now() / 1000);
    sessionStorage.setItem("session_", instance.time);

    if (!last || (instance.time - last) > data.timeout) {
        instance.syncronize = true; //Sessione Scaduta o nuova
    }

    instance.logged = web.getCookie('wgsession_'); //use cookie Api

    instance.user = new webObject("user", null, {store: sessionStore, data:{ type: userEnum.GUEST }});

    new wocontext(instance, instance.user);

    instance.onReady = [];
}

const session = new webObject("session", session_default_decorator, {local: true, language: 'it', timeout: 1800, store: sessionStore});

/*session.init = function (decorator, option) {
    webObject.prototype.init.call(this, decorator, option);
}*/

session.start = function () {

    //Non dovrebbe verificarsi questa condizione, dovrei sempre chiamare prima init() al caricamento della pagina nell'header;
    if (!this.initialized)
        this.init();

    //Se polyfill è abilitato e ancora non caricato è lo script che alla fine chiama session start se in stao di frized
    if (!this.polyfilled) {
        this.frized = true;
        return;
    }

    const onReady = function (warning) {
        console.log("ON READY");
        warning = warning || false;
        document.onreadystatechange = () => {
            if (document.readyState === 'complete') {
                executeAction(warning);
            }
        };

        if (document.readyState === 'complete') {
            executeAction(warning);
        }
    }

    const executeAction = function (warning) {

        if (!document.body) {
            return setTimeout(executeAction, 13);
        }

        document.onreadystatechange = null;

        // Remember that the DOM is ready, da qui se aggiungo handler vengono eseguiti direttamente 
        instance.isReady = true;
        
        // If there are functions bound, to execute
        if (this.onReady) {
            // Execute all of them, the while cycle catch eventually handler added late
            let fn, i = 0;
            while ((fn = this.onReady[i++])) {
                fn.call(warning);
            }

            // Reset the list of handlers
            delete this.onReady; 
        }
    }

    const data = {};

    const ctx = this.context;
    
    ctx.registerAll(arguments);

    ctx.requireSync(data, this.syncronize) //Sync required 
        ? this.sync(data).then((r) => onReady())
        : onReady();
}

session.ready = function (fn) {
    if (this.isReady) {
        fn.call();
    }
    else {
        this.onReady.push(fn);
    }
};

/**
 * 
 * @param {object} config optional: override default session config only for the lifecycle of page 
 * @returns 
 */
export const useSession = function (option) {
    if (!session.initialized) {
        session.init(option);
    }
    return session;
}

//console.log(userLocale); // 👉️ "en-US"
// 👇️ ["en-US", "en", "de"]
//console.log(navigator.languages);