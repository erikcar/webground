import { sessionStore, VERSION, waitAction, webground as web, webObject, wocontext } from "./core";

export const userEnum = {GUEST: "0"}
export const mediaEnum = {MOBILE: "0", TABLET: "1", DESKTOP: "2"}
export const breakPoint = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
}

export const session_default_decorator = (instance, option) => {
    console.log("Session decorator");
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
    console.log("Session version");
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
    console.log("Session logged");
    instance.logged = web.getCookie('wgsession_'); //use cookie Api

    instance.user = new webObject("user", null, {store: sessionStore, data:{ type: userEnum.GUEST }});

    new wocontext(instance, instance.user);

    instance.onReady = [];

    instance.onresize = new waitAction(instance.resize.bind(instance));

    if(instance.syncronize)
        instance.onresize.executeNow();

    window.onresize = function(e){
        instance.onresize.execute();
    }
}

export const session = new webObject("session", session_default_decorator, {local: true, language: 'it', timeout: 1800, store: sessionStore});

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
        ? ctx.sync(data).then((r) => onReady())
        : onReady();
}

session.resize = function(){
    
    const info = this.data;
    console.log("RESIZE", this);

    info.width = document.documentElement.clientWidth;
    info.height = document.documentElement.clientHeight;
    
    let breakpoint = info.breakpoint;
    let media = info.media;

    if(info.width < breakPoint.md){
        info.media = mediaEnum.MOBILE;
        info.width < breakPoint.sm
            ? info.breakpoint = breakPoint.xs
            : info.breakpoint = breakPoint.sm;
    }
    else if(info.width > breakPoint.xl){
        info.media = mediaEnum.DESKTOP;
        info.width > breakPoint.xxl
            ? info.breakpoint = breakPoint.xxl
            : info.breakpoint = breakPoint.xl;
    }
    else{
        info.media = mediaEnum.TABLET;
        info.breakpoint = breakPoint.xxl
    }

    media = media && media !== info.media;  //|| info.media; //Anche la prima volta (new session) o no???
    breakpoint = breakpoint && breakpoint !== info.breakpoint; //|| info.breakpoint;

    if( this.onbreakpoint && (media || breakpoint) ) 
        this.onbreakpoint(info, info.media, info.breakpoint);
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
 * @param {object} option optional: override default session config only for the lifecycle of page 
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